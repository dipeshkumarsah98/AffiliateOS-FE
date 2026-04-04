import re

content = """'use client'

import { useState } from 'react'
import { Check, XCircle, X, Package, Phone, User, CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useSubmitCodVerification } from '@/hooks/use-cod-verifications'
import { useOrderDetailQuery } from '@/hooks/use-orders'
import type { CodVerificationItem } from '@/lib/api/cod-verifications'
import { StatusPill } from '@/components/dashboard/orders/StatusPill'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { formatRelative } from 'date-fns'

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 2,
    }).format(amount)
}

interface CodVerificationModalProps {
    order: CodVerificationItem
    onClose: () => void
}

export function CodVerificationModal({ order, onClose }: CodVerificationModalProps) {
    const [response, setResponse] = useState<'confirmed' | 'rejected' | ''>('')
    const [remark, setRemark] = useState('')

    const submitMutation = useSubmitCodVerification()
    const { data: orderDetail, isLoading: isLoadingDetail } = useOrderDetailQuery(order.id)

    const verificationStatus = order.verification?.verificationStatus || 'PENDING'
    const isPending = verificationStatus === 'PENDING'
    const isConfirmed = verificationStatus === 'CONFIRMED'
    const isRejected = verificationStatus === 'REJECTED'

    async function handleSubmit() {
        if (!response) return

        try {
            await submitMutation.mutateAsync({
                orderId: order.id,
                verificationStatus: response === 'confirmed' ? 'CONFIRMED' : 'REJECTED',
                customerResponse: response === 'confirmed' ? 'intentional' : 'not_intentional',
                remarks: remark || undefined,
            })
            setTimeout(() => {
                onClose()
            }, 1000)
        } catch (error) {
            console.error('Failed to submit verification:', error)
        }
    }

    const currency = orderDetail?.currency ?? order.currency ?? 'USD'

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden">
                <VisuallyHidden>
                    <DialogTitle>COD Verification #{order.orderNumber}</DialogTitle>
                </VisuallyHidden>

                <div className="flex flex-col max-h-[88vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-7 py-5 border-b bg-muted/10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <StatusPill status={verificationStatus.toLowerCase() as any} />
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                    COD
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">#{order.orderNumber}</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Placed {formatRelative(new Date(order.createdAt), new Date())}
                            </p>
                        </div>
                    </div>

                    <div className="p-7 overflow-y-auto flex-1">
                        {/* Customer Row */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            {/* Customer */}
                            <div className="flex-1 flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">Customer</p>
                                    <p className="text-sm font-semibold truncate">{order.user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{order.user.email}</p>
                                    <a
                                        href={`tel:${order.user.phone}`}
                                        className="text-xs font-semibold hover:underline inline-flex items-center gap-1 text-primary mt-1.5"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Phone className="w-3 h-3" />
                                        {order.user.phone}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Items Summary */}
                        <div className="mb-6">
                            <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-muted-foreground">
                                Items
                            </p>
                            {isLoadingDetail ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-14 w-full rounded-lg" />
                                    <Skeleton className="h-14 w-full rounded-lg" />
                                </div>
                            ) : orderDetail?.items && orderDetail.items.length > 0 ? (
                                <div className="space-y-3">
                                    {orderDetail.items.map(item => (
                                        <div key={item.id} className="flex items-center gap-3 py-1">
                                            {item.product.images[0] ? (
                                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                                                    <img
                                                        src={item.product.images[0]}
                                                        alt={item.product.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg shrink-0 bg-muted flex items-center justify-center">
                                                    <Package className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{item.product.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {item.quantity} × {formatCurrency(item.unitPrice, currency)}
                                                </p>
                                            </div>
                                            <span className="text-sm font-bold shrink-0 px-2">
                                                {formatCurrency(item.totalPrice, currency)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-center py-4 text-muted-foreground">No items found</p>
                            )}

                            {/* Totals */}
                            <div className="mt-4 pt-4 space-y-1.5 border-t border-border/50">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(order.totalAmount, currency)}</span>
                                </div>
                                {order.affiliateId && orderDetail?.earnings && orderDetail.earnings.length > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Affiliate Commission</span>
                                        <span className="font-semibold text-emerald-600">
                                            {formatCurrency(orderDetail.earnings[0].amount, currency)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-bold pt-1 text-foreground">
                                    <span>Total (COD)</span>
                                    <span>{formatCurrency(order.totalAmount, currency)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Verification details or form */}
                        {!isPending ? (
                            /* Show verification details for confirmed/rejected orders */
                            <div className={`rounded-xl p-4 space-y-3 border ${isConfirmed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                <div className="flex items-center gap-2">
                                    {isConfirmed ? (
                                        <Check className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    )}
                                    <p className={`text-sm font-bold ${isConfirmed ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-700 dark:text-red-500'}`}>
                                        {isConfirmed ? 'Order Confirmed' : 'Order Rejected'}
                                    </p>
                                </div>
                                {order.verification?.remarks && (
                                    <div>
                                        <p className={`text-xs font-semibold mb-1 ${isConfirmed ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400'}`}>Remarks:</p>
                                        <p className={`text-xs ${isConfirmed ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400'}`}>{order.verification.remarks}</p>
                                    </div>
                                )}
                                {order.verification?.verifiedAt && (
                                    <p className={`text-xs ${isConfirmed ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-800 dark:text-red-400'}`}>
                                        Verified {formatRelative(new Date(order.verification.verifiedAt), new Date())}
                                    </p>
                                )}
                            </div>
                        ) : (
                            /* Show verification form for pending orders */
                            <div className="rounded-xl p-5 space-y-4 bg-muted/30 border border-border/50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Customer Verification Action
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {([
                                        {
                                            value: 'confirmed' as const,
                                            label: 'Confirmed',
                                            desc: 'Customer intends to buy',
                                            icon: Check,
                                            activeBg: 'bg-emerald-500/10',
                                            activeBorder: 'border-emerald-500/30',
                                            color: 'text-emerald-600'
                                        },
                                        {
                                            value: 'rejected' as const,
                                            label: 'Rejected',
                                            desc: 'Customer declined/unreachable',
                                            icon: XCircle,
                                            activeBg: 'bg-red-500/10',
                                            activeBorder: 'border-red-500/30',
                                            color: 'text-red-600'
                                        },
                                    ] as const).map(opt => {
                                        const Icon = opt.icon
                                        const isSelected = response === opt.value
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setResponse(opt.value)}
                                                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all border ${isSelected ? `${opt.activeBg} ${opt.activeBorder}` : 'bg-background border-border shadow-xs hover:bg-muted/50'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? opt.activeBorder.replace('border-', 'bg-').replace('/30', '/20') : 'bg-muted'}`}>
                                                    <Icon className={`w-4 h-4 ${isSelected ? opt.color : 'text-muted-foreground'}`} />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${isSelected ? opt.color : 'text-foreground'}`}>
                                                        {opt.label}
                                                    </p>
                                                    <p className={`text-[11px] mt-0.5 ${isSelected ? opt.color.replace('600', '700') : 'text-muted-foreground'}`}>
                                                        {opt.desc}
                                                    </p>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground mt-2">
                                        Remarks (optional)
                                    </label>
                                    <Textarea
                                        value={remark}
                                        onChange={e => setRemark(e.target.value)}
                                        placeholder="Add notes about this call..."
                                        rows={3}
                                        className="resize-none text-sm bg-background shadow-xs"
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!response || submitMutation.isPending}
                                        className="w-full h-11"
                                        variant={response === 'confirmed' ? 'default' : response === 'rejected' ? 'destructive' : 'secondary'}
                                    >
                                        {submitMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : response === 'confirmed' ? (
                                            <Check className="w-4 h-4 mr-2" />
                                        ) : response === 'rejected' ? (
                                            <XCircle className="w-4 h-4 mr-2" />
                                        ) : null}
                                        {submitMutation.isPending 
                                            ? 'Submitting...' 
                                            : response === 'confirmed' 
                                                ? 'Submit Confirmation' 
                                                : response === 'rejected' 
                                                    ? 'Submit Rejection' 
                                                    : 'Select an Action'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
"""

with open("components/dashboard/cod-verifications/CodVerificationModal.tsx", "w") as f:
    f.write(content)
