'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { StockAdjustmentErrorState } from '@/components/dashboard/StockAdjustmentErrorState'
import { StockAdjustmentLoadingState } from '@/components/dashboard/StockAdjustmentLoadingState'
import { useCreateStockMovementMutation, useStockMovementsQuery } from '@/hooks/use-stock-movements'
import { getApiErrorMessage } from '@/lib/api/client'
import type { StockMovementReason } from '@/lib/api/stock-movements'
import { formatRelative, getMovementReasonLabel, stockHealth } from '@/lib/stock-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    ArrowUpRight,
    BookOpen,
    ChevronLeft,
    Minus,
    PackagePlus,
    Plus,
    RefreshCw,
    RotateCcw,
    Wrench,
} from 'lucide-react'

type AdjustmentType = 'add' | 'remove'
type Reason = StockMovementReason

type ReasonOption = {
    id: Reason
    label: string
    description: string
    icon: React.ReactNode
}

const REASON_OPTIONS: Record<AdjustmentType, ReasonOption[]> = {
    add: [
        {
            id: 'RESTOCK',
            label: 'Restock',
            description: 'New inventory received from supplier.',
            icon: <PackagePlus className="w-5 h-5" />,
        },
        {
            id: 'RETURN',
            label: 'Customer Return',
            description: 'Sellable units returned back into stock.',
            icon: <RotateCcw className="w-5 h-5" />,
        },
        {
            id: 'ORDER_CANCELLED',
            label: 'Order Cancelled',
            description: 'Reserved stock was returned after cancellation.',
            icon: <RotateCcw className="w-5 h-5" />,
        },
        {
            id: 'CORRECTION',
            label: 'Count Correction',
            description: 'Inventory count was lower than actual stock.',
            icon: <Wrench className="w-5 h-5" />,
        },
    ],
    remove: [
        {
            id: 'CORRECTION',
            label: 'Inventory Correction',
            description: 'Count reduced after audit or reconciliation.',
            icon: <ArrowUpRight className="w-5 h-5" />,
        },
    ],
}

export default function StockAdjustmentPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const {
        data: stockMovementsData,
        isLoading: isStockMovementsLoading,
        isError: isStockMovementsError,
        error: stockMovementsError,
    } = useStockMovementsQuery(id)
    const { mutateAsync: createStockMovement, isPending: isSavingStockMovement } = useCreateStockMovementMutation(id)

    // All state hooks must be called before any conditional returns
    const [adjustType, setAdjustType] = useState<AdjustmentType>('add')
    const [quantity, setQuantity] = useState<number | ''>('')
    const [reason, setReason] = useState<Reason>('RESTOCK')
    const [notes, setNotes] = useState('')
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

    // All hooks (including useMemo, useEffect) must be called before conditional returns
    const stockMovements = stockMovementsData?.items ?? []
    const recentMovements = useMemo(() => {
        return [...stockMovements]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
    }, [stockMovements])
    const productInfo = stockMovements[0]?.product
    const currentStock = useMemo(() => {
        const netStock = stockMovements.reduce((total, movement) => {
            return movement.type === 'IN' ? total + movement.quantity : total - movement.quantity
        }, 0)

        return Math.max(0, netStock)
    }, [stockMovements])

    const numericQuantity = typeof quantity === 'number' ? quantity : 0
    const projectedStock = useMemo(() => {
        if (!numericQuantity) return currentStock
        if (adjustType === 'add') return currentStock + numericQuantity
        return Math.max(0, currentStock - numericQuantity)
    }, [adjustType, currentStock, numericQuantity])

    const projectedHealth = stockHealth(projectedStock)

    useEffect(() => {
        setReason(REASON_OPTIONS[adjustType][0].id)
    }, [adjustType])

    // Conditional returns must happen AFTER all hooks
    if (isStockMovementsLoading) {
        return <StockAdjustmentLoadingState />
    }

    if (isStockMovementsError) {
        return <StockAdjustmentErrorState message={getApiErrorMessage(stockMovementsError, 'Failed to load stock movements.')} />
    }

    const productName = productInfo?.title ?? 'Product'
    const productSlug = productInfo?.slug ?? 'N/A'
    const reasonOptions = REASON_OPTIONS[adjustType]

    const handleSave = async () => {
        if (!quantity || Number(quantity) <= 0) return

        if (!id) return

        setSaveError(null)

        try {
            await createStockMovement({
                productId: id,
                type: adjustType === 'add' ? 'IN' : 'OUT',
                quantity: Number(quantity),
                reason,
                ...(notes.trim() ? { notes: notes.trim() } : {}),
            }, {
                onSuccess: () => {
                    setQuantity('')
                    setNotes('')
                    setIsConfirmDialogOpen(false)
                    router.push('/dashboard/products')
                },
                onError: (error) => {
                    setSaveError(getApiErrorMessage(error, 'Failed to save stock adjustment.'));
                    setIsConfirmDialogOpen(false);
                }
            })
        } catch (error) {
            setSaveError(getApiErrorMessage(error, 'Failed to save stock adjustment.'))
        }
    }

    return (
        <div className="flex flex-col min-h-screen" style={{ background: '#f8faff' }}>
            <Topbar title="Stock Adjustment" description="" />

            <div className="flex-1 p-4 md:p-8 max-w-screen-2xl mx-auto w-full">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard/products')}
                    className="mb-7 gap-2 px-0 hover:bg-transparent hover:opacity-70"
                    style={{ color: '#2b4bb9' }}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Products
                </Button>

                <Card
                    className="rounded-3xl border-0 px-0 py-0 mb-6 md:mb-8"
                    style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 45%, #f8faff 100%)' }}
                >
                    <CardContent className="p-5 md:p-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#6366f1' }}>
                                    Stock Adjustment
                                </p>
                                <h1
                                    className="text-2xl md:text-3xl font-bold text-balance"
                                    style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.02em' }}
                                >
                                    {productName}
                                </h1>
                                <p className="text-sm mt-2" style={{ color: '#6b7280' }}>
                                    Slug: {productSlug} · Update inventory counts with a clear, auditable reason.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:min-w-130">
                                <Card className="rounded-2xl border-0 py-0" style={{ background: '#fff', boxShadow: '0 2px 12px rgba(19,27,46,0.06)' }}>
                                    <CardContent className="px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9ca3af' }}>
                                            Current Stock
                                        </p>
                                        <div className="flex items-baseline gap-1.5">
                                            <span
                                                className="text-3xl font-bold"
                                                style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.03em' }}
                                            >
                                                {currentStock.toLocaleString()}
                                            </span>
                                            <span className="text-sm" style={{ color: '#9ca3af' }}>units</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border-0 py-0" style={{ background: '#fff', boxShadow: '0 2px 12px rgba(19,27,46,0.06)' }}>
                                    <CardContent className="px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9ca3af' }}>
                                            Projected Stock
                                        </p>
                                        <div className="flex items-baseline gap-1.5">
                                            <span
                                                className="text-3xl font-bold"
                                                style={{ fontFamily: 'var(--font-display)', color: '#2b4bb9', letterSpacing: '-0.03em' }}
                                            >
                                                {projectedStock.toLocaleString()}
                                            </span>
                                            <span className="text-sm" style={{ color: '#9ca3af' }}>units</span>
                                        </div>
                                    </CardContent>
                                </Card>

                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
                    <Card className="rounded-3xl border-0 py-0" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}>
                        <CardContent className="p-5 md:p-8">
                            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.02em' }}>
                                Adjustment Details
                            </h2>
                            <p className="text-sm mb-7" style={{ color: '#6b7280' }}>
                                Choose the stock movement first, then select a reason that fits that action.
                            </p>

                            <div className="mb-7">
                                <Label className="mb-3" style={{ color: '#374151' }}>
                                    Adjustment Type
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => setAdjustType('add')}
                                        className="h-auto justify-start gap-3 px-5 py-4 rounded-2xl text-sm font-semibold text-left"
                                        style={adjustType === 'add'
                                            ? { background: '#2b4bb9', color: '#fff', boxShadow: '0 4px 12px rgba(43,75,185,0.25)' }
                                            : { background: '#f8faff', color: '#374151', border: '1.5px solid #e5e7eb' }
                                        }
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: adjustType === 'add' ? 'rgba(255,255,255,0.16)' : '#e8efff' }}>
                                            <Plus className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p>Add Stock</p>
                                            <p className="text-xs font-medium mt-0.5" style={{ color: adjustType === 'add' ? 'rgba(255,255,255,0.78)' : '#6b7280' }}>
                                                Increase sellable inventory.
                                            </p>
                                        </div>
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={() => setAdjustType('remove')}
                                        className="h-auto justify-start gap-3 px-5 py-4 rounded-2xl text-sm font-semibold text-left"
                                        style={adjustType === 'remove'
                                            ? { background: '#0f1623', color: '#fff' }
                                            : { background: '#f8faff', color: '#374151', border: '1.5px solid #e5e7eb' }
                                        }
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: adjustType === 'remove' ? 'rgba(255,255,255,0.12)' : '#f3f4f6' }}>
                                            <Minus className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p>Remove Stock</p>
                                            <p className="text-xs font-medium mt-0.5" style={{ color: adjustType === 'remove' ? 'rgba(255,255,255,0.78)' : '#6b7280' }}>
                                                Deduct damaged or missing units.
                                            </p>
                                        </div>
                                    </Button>
                                </div>
                            </div>

                            <div className='mb-7 gap-5'>
                                <Label className="mb-2" style={{ color: '#374151' }}>Quantity</Label>
                                <div
                                    className="flex items-center rounded-2xl px-4 py-3.5"
                                    style={{ background: '#f8faff', border: '1.5px solid #e5e7eb' }}
                                >
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        value={quantity}
                                        onChange={e => {
                                            const value = e.target.value
                                            if (value === '') {
                                                setQuantity('')
                                                return
                                            }

                                            const parsed = Number(value)
                                            if (Number.isNaN(parsed)) {
                                                return
                                            }

                                            setQuantity(Math.max(0, parsed))
                                        }}
                                        className="border-0 shadow-none bg-transparent h-auto px-0 py-0 text-base focus-visible:ring-0"
                                        style={{ color: '#0f1623' }}
                                    />
                                    <span className="text-sm ml-2" style={{ color: '#9ca3af' }}>units</span>
                                </div>
                            </div>

                            <div className="mb-7">
                                <Label className="mb-3" style={{ color: '#374151' }}>
                                    Reason for Adjustment
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {reasonOptions.map(option => (
                                        <Button
                                            type="button"
                                            key={option.id}
                                            onClick={() => setReason(option.id)}
                                            className="h-auto flex flex-col items-start justify-start gap-3 p-4 rounded-2xl text-sm font-semibold text-left min-h-37"
                                            style={reason === option.id
                                                ? { background: '#f0f4ff', color: '#2b4bb9', border: '2px solid #2b4bb9' }
                                                : { background: '#f8faff', color: '#6b7280', border: '2px solid #e5e7eb' }
                                            }
                                        >
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: reason === option.id ? '#dbe6ff' : '#ffffff' }}>
                                                {option.icon}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{option.label}</p>
                                                <p className="text-xs mt-1 leading-relaxed" style={{ color: reason === option.id ? '#4964c9' : '#6b7280' }}>
                                                    {option.description}
                                                </p>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-8">
                                <Label className="mb-2" style={{ color: '#374151' }}>
                                    Internal Notes <span className="font-normal" style={{ color: '#9ca3af' }}>(Optional)</span>
                                </Label>
                                <Textarea
                                    rows={4}
                                    placeholder="Add additional context for this adjustment..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="rounded-2xl border-[1.5px] shadow-none"
                                    style={{ background: '#f8faff', borderColor: '#e5e7eb', color: '#0f1623', fontFamily: 'inherit' }}
                                />
                            </div>

                            <Card className="rounded-2xl py-0 mb-6 border" style={{ background: '#f8faff', borderColor: '#e5e7eb' }}>
                                <CardContent className="p-4 md:p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>
                                                Change Summary
                                            </p>
                                            <p className="text-sm font-semibold" style={{ color: '#0f1623' }}>
                                                {adjustType === 'add' ? 'Add' : 'Remove'} {numericQuantity || 0} units via {reasonOptions.find(option => option.id === reason)?.label.toLowerCase()}
                                            </p>
                                        </div>
                                        <div className="text-sm" style={{ color: '#6b7280' }}>
                                            New stock level: <span className="font-bold" style={{ color: projectedHealth.color }}>{projectedStock}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {saveError ? (
                                <p className="text-sm mb-4" style={{ color: '#dc2626' }}>
                                    {saveError}
                                </p>
                            ) : null}

                            <div className="flex flex-col-reverse sm:flex-row sm:items-stretch gap-3">
                                <Button
                                    type="button"
                                    onClick={() => router.push('/dashboard/products')}
                                    variant="secondary"
                                    className="w-full sm:w-auto sm:shrink-0 px-5 py-3.5 rounded-2xl text-sm font-semibold"
                                    style={{ background: '#f3f4f6', color: '#374151' }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setIsConfirmDialogOpen(true)}
                                    disabled={!quantity || Number(quantity) <= 0 || isSavingStockMovement}
                                    className="w-full sm:flex-1 sm:min-w-0 py-3.5 rounded-2xl text-sm font-semibold text-white"
                                    style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)', boxShadow: '0 4px 14px rgba(43,75,185,0.3)' }}
                                >
                                    {isSavingStockMovement ? (
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <BookOpen className="w-4 h-4" />
                                    )}
                                    Save Adjustment
                                </Button>
                            </div>

                            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm stock adjustment?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            You are about to {adjustType === 'add' ? 'add' : 'remove'} {numericQuantity || 0} units for {productName}. This action will be recorded in stock movements.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isSavingStockMovement}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleSave} disabled={isSavingStockMovement}>
                                            {isSavingStockMovement ? 'Saving...' : 'Confirm & Save'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>

                    <div className="space-y-5 xl:sticky xl:top-6">
                        <div>
                            <Card
                                className="rounded-2xl border py-0 h-full"
                                style={{
                                    background: adjustType === 'add' ? '#eef2ff' : '#fff7ed',
                                    borderColor: adjustType === 'add' ? '#c7d2fe' : '#fed7aa',
                                }}
                            >
                                <CardContent className="px-4 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6b7280' }}>
                                        Adjustment Effect
                                    </p>
                                    <p className="text-sm font-semibold" style={{ color: '#0f1623' }}>
                                        {adjustType === 'add' ? 'This will increase available stock.' : 'This will reduce available stock.'}
                                    </p>
                                    <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
                                        Projected stock updates live as you change quantity.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="rounded-3xl border-0 py-0" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}>
                            <CardContent className="p-5 md:p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <RefreshCw className="w-4 h-4" style={{ color: '#6366f1' }} />
                                    <h3 className="text-sm font-bold" style={{ color: '#0f1623' }}>Recent Movements</h3>
                                </div>

                                <div className="space-y-4">
                                    {recentMovements.length === 0 ? (
                                        <p className="text-xs text-center py-4" style={{ color: '#9ca3af' }}>No recent movements</p>
                                    ) : (
                                        recentMovements.map(m => (
                                            <div key={m.id} className="flex items-start gap-3">
                                                <div
                                                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                                    style={{ background: m.type === 'IN' ? '#dcfce7' : '#fee2e2' }}
                                                >
                                                    {m.type === 'IN'
                                                        ? <Plus className="w-3.5 h-3.5" style={{ color: '#16a34a' }} />
                                                        : <Minus className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold" style={{ color: '#0f1623' }}>
                                                        {m.type === 'IN' ? '+' : '-'}{m.quantity} units
                                                    </p>
                                                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                                                        {m.notes || getMovementReasonLabel(m.reason)} • {formatRelative(m.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <Button
                                    type="button"
                                    variant="link"
                                    className="mt-5 px-0 h-auto text-xs font-semibold"
                                    style={{ color: '#2b4bb9' }}
                                >
                                    View Full Ledger
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
