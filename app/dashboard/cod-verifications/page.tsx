'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Topbar } from '@/components/layout/Topbar'
import { DUMMY_ORDERS, DUMMY_PRODUCTS, DUMMY_AFFILIATES } from '@/lib/dummy-data'
import type { Order, OrderStatus } from '@/lib/types'
import {
    X, Check, XCircle, ChevronDown, Package, Search, ChevronLeft, ChevronRight,
    AlertCircle, PhoneCall, Clock, CheckCircle2, Ban, RefreshCw, Phone
} from 'lucide-react'
import { format, formatRelative } from 'date-fns'
import { useDebounce } from '@/hooks/use-debounce'
import { DateFilter, DateFilterValue } from '@/components/dashboard/orders/DateFilter'
import { cn } from '@/lib/utils'

// ─── Helpers ────────────────────────────────────────────────────────────────

const VERIFICATION_STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Verification' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'rejected', label: 'Rejected' },
]

const PAGE_SIZE = 8

function getDefaultDateFilter(): DateFilterValue {
    return {
        type: 'all_time',
        range: {
            from: undefined,
            to: undefined
        }
    }
}

function formatRelativeTime(date: string): string {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function AffiliateAvatar({ name }: { name: string }) {
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    const colors = [
        ['#dbeafe', '#1d4ed8'], ['#dcfce7', '#166534'], ['#fce7f3', '#9d174d'],
        ['#fef9c3', '#92400e'], ['#ede9fe', '#6d28d9'], ['#fee2e2', '#991b1b'],
    ]
    const idx = name.charCodeAt(0) % colors.length
    return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0"
            style={{ background: colors[idx][0], color: colors[idx][1] }}>
            {initials}
        </span>
    )
}

function StatusBadge({ status }: { status: 'pending' | 'confirmed' | 'rejected' }) {
    const config = {
        pending: { bg: '#fff8e6', color: '#b45309', dot: '#f59e0b', label: 'Pending', icon: Clock },
        confirmed: { bg: '#f0fdf4', color: '#166534', dot: '#16a34a', label: 'Confirmed', icon: CheckCircle2 },
        rejected: { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444', label: 'Rejected', icon: Ban },
    }
    const c = config[status]
    const Icon = c.icon
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{ background: c.bg, color: c.color }}>
            <Icon className="w-3 h-3 flex-shrink-0" />
            {c.label}
        </span>
    )
}

// ─── Select Component ────────────────────────────────────────────────────────

function Select({ value, onChange, options, width = 180 }: {
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
    width?: number
}) {
    return (
        <div className="relative flex-shrink-0" style={{ width }}>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                style={{ background: '#fff', border: '1.5px solid #e2e8f0', color: '#374151' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#2b4bb9')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#9ca3af' }} />
        </div>
    )
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, pageSize, onChange }: {
    page: number
    totalPages: number
    total: number
    pageSize: number
    onChange: (p: number) => void
}) {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
        pages.push(1)
        if (page > 3) pages.push('...')
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
        if (page < totalPages - 2) pages.push('...')
        pages.push(totalPages)
    }
    const from = (page - 1) * pageSize + 1
    const to = Math.min(page * pageSize, total)

    return (
        <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm" style={{ color: '#6b7280' }}>
                Showing <b style={{ color: '#0f172a' }}>{from}–{to}</b> of <b style={{ color: '#0f172a' }}>{total}</b>
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onChange(page - 1)} disabled={page === 1}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f4f5ff]"
                    style={{ color: '#374151' }}
                ><ChevronLeft className="w-4 h-4" /></button>
                {pages.map((p, i) =>
                    p === '...' ? (
                        <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-sm" style={{ color: '#9ca3af' }}>…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onChange(p as number)}
                            className="w-9 h-9 rounded-xl text-sm font-semibold transition-all"
                            style={p === page
                                ? { background: '#2b4bb9', color: '#fff' }
                                : { color: '#374151', background: 'transparent' }}
                        >{p}</button>
                    )
                )}
                <button
                    onClick={() => onChange(page + 1)} disabled={page === totalPages}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f4f5ff]"
                    style={{ color: '#374151' }}
                ><ChevronRight className="w-4 h-4" /></button>
            </div>
        </div>
    )
}

// ─── COD Verification Modal ──────────────────────────────────────────────────

function CodVerificationModal({ order, onClose }: { order: Order; onClose: () => void }) {
    const [response, setResponse] = useState<'confirmed' | 'rejected' | ''>('')
    const [remark, setRemark] = useState('')
    const [done, setDone] = useState(false)

    const affiliate = DUMMY_AFFILIATES.find(a => a.affiliateCode === order.affiliateCode)
    const product = DUMMY_PRODUCTS.find(p => p.id === order.productId)

    function handleSubmit() {
        if (!response) return
        setDone(true)
        setTimeout(onClose, 2000)
    }

    if (done) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(19,27,46,0.5)', backdropFilter: 'blur(12px)' }}
            >
                <div
                    className="w-full max-w-sm rounded-2xl p-10 text-center animate-fade-in-up"
                    style={{ background: '#fff', boxShadow: '0 24px 60px rgba(19,27,46,0.18)' }}
                >
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                        style={{ background: response === 'confirmed' ? '#f0fdf4' : '#fef2f2' }}
                    >
                        {response === 'confirmed'
                            ? <Check className="w-8 h-8" style={{ color: '#16a34a' }} />
                            : <XCircle className="w-8 h-8" style={{ color: '#dc2626' }} />}
                    </div>
                    <p className="text-lg font-bold" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                        Order {response === 'confirmed' ? 'Confirmed' : 'Rejected'}
                    </p>
                    <p className="text-sm mt-1.5" style={{ color: '#6b7280' }}>
                        {order.id} has been {response === 'confirmed' ? 'marked as verified' : 'rejected'}. Status updated successfully.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(19,27,46,0.5)', backdropFilter: 'blur(12px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full flex flex-col sm:flex-row overflow-hidden rounded-2xl animate-fade-in-up"
                style={{ maxWidth: '780px', background: '#fff', boxShadow: '0 24px 60px rgba(19,27,46,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div className="flex-1 min-w-0 p-5 sm:p-8 flex flex-col gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                                style={{ background: '#fff8e6', color: '#b45309' }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
                                COD – Awaiting Verification
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.03em' }}>
                            {order.id}
                        </h2>
                        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                            Placed on {" "}
                            {formatRelative(new Date(order.createdAt), new Date())}
                        </p>
                    </div>

                    {/* Items Summary */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Items Summary</p>
                        <div className="space-y-3">
                            {product ? (
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#f1f5f9' }}>
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>{product.name}</p>
                                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Qty: {order.quantity ?? 1}</p>
                                    </div>
                                    <span className="text-sm font-bold flex-shrink-0" style={{ color: '#0f172a' }}>
                                        NPR {order.total.toFixed(2)}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm" style={{ color: '#6b7280' }}>{order.productName}</span>
                                    <span className="text-sm font-bold" style={{ color: '#0f172a' }}>NPR {order.total.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        {/* Total row */}
                        <div
                            className="flex items-center justify-between mt-4 pt-4 px-4 py-3 rounded-xl"
                            style={{ background: '#f8faff', borderTop: '1px solid #f4f5ff' }}
                        >
                            <span className="text-sm font-semibold" style={{ color: '#374151' }}>Total (COD)</span>
                            <span className="text-lg font-bold" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                                NPR {order.total.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Customer + Affiliate row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: '#9ca3af' }}>Customer</p>
                            <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{order.customerName}</p>
                            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{order.customerEmail}</p>
                            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{order.customerPhone}</p>
                        </div>

                        {order.affiliateCode && affiliate ? (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: '#9ca3af' }}>Affiliate Info</p>
                                <div className="p-3 rounded-xl" style={{ background: '#f8faff', border: '1px solid #e0e7ff' }}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#2b4bb9' }} />
                                        <span className="text-sm font-semibold" style={{ color: '#2b4bb9' }}>{affiliate.fullName}</span>
                                    </div>
                                    <p className="text-xs" style={{ color: '#6b7280' }}>Code: {order.affiliateCode}</p>
                                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#16a34a' }}>
                                        Comm: ${(order.affiliateDiscount ?? 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: '#9ca3af' }}>Address</p>
                                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{order.address}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL: Verification Action ── */}
                <div
                    className="sm:w-72 flex-shrink-0 flex flex-col p-5 sm:p-7 gap-6"
                    style={{ background: '#fafbff', borderTop: '1px solid #f1f5f9' }}
                >
                    {/* Close */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Verification</p>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#f1f5f9]"
                            style={{ color: '#6b7280' }}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Customer Response */}
                    <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>
                            Customer Response
                        </p>
                        <div className="space-y-2.5">
                            {([
                                { value: 'confirmed' as const, label: 'Customer confirmed order', icon: Check, activeBg: '#f0fdf4', activeBorder: '#86efac', color: '#16a34a' },
                                { value: 'rejected' as const, label: 'Customer rejected / unreachable', icon: XCircle, activeBg: '#fef2f2', activeBorder: '#fca5a5', color: '#dc2626' },
                            ] as const).map(opt => {
                                const Icon = opt.icon
                                const isSelected = response === opt.value
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setResponse(opt.value)}
                                        className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                                        style={{
                                            background: isSelected ? opt.activeBg : '#fff',
                                            border: `1.5px solid ${isSelected ? opt.activeBorder : '#e2e8f0'}`,
                                        }}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: isSelected ? opt.color + '20' : '#f8faff' }}
                                        >
                                            <Icon className="w-4 h-4" style={{ color: isSelected ? opt.color : '#9ca3af' }} />
                                        </div>
                                        <span className="text-sm font-medium leading-snug" style={{ color: isSelected ? opt.color : '#374151' }}>
                                            {opt.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Remarks */}
                        <div className="mt-5">
                            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>
                                Remarks (optional)
                            </label>
                            <textarea
                                value={remark}
                                onChange={e => setRemark(e.target.value)}
                                placeholder="Add notes about this call..."
                                rows={4}
                                className="w-full px-3.5 py-3 rounded-xl text-sm resize-none outline-none transition-all"
                                style={{ background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0' }}
                                onFocus={e => (e.currentTarget.style.borderColor = '#2b4bb9')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                            />
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2.5 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                        <button
                            onClick={handleSubmit}
                            disabled={!response}
                            className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            style={{
                                background: response === 'confirmed'
                                    ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
                                    : response === 'rejected'
                                        ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                                        : 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)',
                            }}
                        >
                            {response === 'confirmed'
                                ? <><Check className="w-4 h-4" /> Confirm Order</>
                                : response === 'rejected'
                                    ? <><XCircle className="w-4 h-4" /> Reject Order</>
                                    : 'Select a Response'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f1f5f9]"
                            style={{ background: '#f8faff', color: '#6b7280' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Stats Card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, trend }: {
    label: string
    value: string | number
    icon: React.ReactNode
    trend?: { value: string; positive: boolean }
}) {
    return (
        <div className="rounded-xl p-5 transition-all" style={{ background: '#fff', border: '1px solid #f0f0f0' }}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {icon}
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>{label}</p>
                </div>
                {trend && (
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md", trend.positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                        {trend.value}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#0f172a', letterSpacing: '-0.03em' }}>
                {value}
            </p>
        </div>
    )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CodVerificationsPage() {
    const currentUser = useAuthStore((s) => s.currentUser)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initialize state from URL params
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const debouncedSearch = useDebounce(search, 500)
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all')
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    // Date filter state
    const [dateFilter, setDateFilter] = useState<DateFilterValue>(() => {
        const fromDate = searchParams.get('fromDate')
        const toDate = searchParams.get('toDate')
        const filterType = searchParams.get('dateType') as DateFilterValue['type']

        if (fromDate && toDate) {
            return {
                type: filterType || 'custom',
                range: {
                    from: new Date(fromDate),
                    to: new Date(toDate)
                }
            }
        }
        return getDefaultDateFilter()
    })

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()

        if (search.trim()) params.set('search', search.trim())
        if (statusFilter !== 'all') params.set('status', statusFilter)
        if (page !== 1) params.set('page', String(page))
        if (dateFilter.range.from) params.set('fromDate', format(dateFilter.range.from, 'yyyy-MM-dd'))
        if (dateFilter.range.to) params.set('toDate', format(dateFilter.range.to, 'yyyy-MM-dd'))
        if (dateFilter.type && dateFilter.type !== 'all_time') params.set('dateType', dateFilter.type)

        const newUrl = params.toString() ? `/dashboard/cod-verifications?${params.toString()}` : '/dashboard/cod-verifications'
        router.replace(newUrl, { scroll: false })
    }, [search, statusFilter, page, dateFilter, router])

    // Check admin access
    useEffect(() => {
        if (!currentUser?.roles.includes('admin')) router.replace('/dashboard')
    }, [currentUser, router])

    // Filter COD orders
    const codOrders = useMemo(() => {
        return DUMMY_ORDERS.filter(o => o.paymentMethod === 'cod')
    }, [])

    // Apply filters
    const filteredOrders = useMemo(() => {
        let list = codOrders

        // Search filter
        if (debouncedSearch) {
            const searchLower = debouncedSearch.toLowerCase()
            list = list.filter(o =>
                o.id.toLowerCase().includes(searchLower) ||
                o.customerName.toLowerCase().includes(searchLower) ||
                o.customerEmail.toLowerCase().includes(searchLower) ||
                o.customerPhone?.toLowerCase().includes(searchLower)
            )
        }

        // Status filter
        if (statusFilter === 'pending') {
            list = list.filter(o => o.status === 'awaiting_verification')
        } else if (statusFilter === 'confirmed') {
            list = list.filter(o => o.status === 'processing' || o.status === 'shipped' || o.status === 'completed')
        } else if (statusFilter === 'rejected') {
            list = list.filter(o => o.status === 'cancelled')
        }

        // Date filter
        if (dateFilter.range.from && dateFilter.range.to) {
            const fromTime = dateFilter.range.from.getTime()
            const toTime = dateFilter.range.to.getTime() + 86400000 // End of day
            list = list.filter(o => {
                const orderTime = new Date(o.createdAt).getTime()
                return orderTime >= fromTime && orderTime <= toTime
            })
        }

        // Sort by most recent
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [codOrders, debouncedSearch, statusFilter, dateFilter])

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
    const safePage = Math.min(page, totalPages)
    const paginatedOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

    // Ensure safePage is synced
    useEffect(() => {
        if (safePage !== page) setPage(safePage)
    }, [page, safePage])

    // Calculate stats
    const totalCod = codOrders.length
    const pendingVerification = codOrders.filter(o => o.status === 'awaiting_verification').length
    const todayConfirmed = codOrders.filter(o => {
        const isToday = new Date(o.createdAt).toDateString() === new Date().toDateString()
        return isToday && (o.status === 'processing' || o.status === 'shipped' || o.status === 'completed')
    }).length
    const rejectionRate = totalCod > 0 ? ((codOrders.filter(o => o.status === 'cancelled').length / totalCod) * 100).toFixed(1) : '0.0'

    function handlePage(p: number) {
        setPage(Math.max(1, Math.min(p, totalPages)))
    }

    function handleDateFilterChange(newDateFilter: DateFilterValue) {
        setDateFilter(newDateFilter)
        setPage(1)
    }

    function handleStatusChange(status: string) {
        setStatusFilter(status)
        setPage(1)
    }

    function handleSearchChange(searchValue: string) {
        setSearch(searchValue)
        setPage(1)
    }

    // Map order status to verification status for display
    function getVerificationStatus(orderStatus: OrderStatus): 'pending' | 'confirmed' | 'rejected' {
        if (orderStatus === 'awaiting_verification') return 'pending'
        if (orderStatus === 'cancelled') return 'rejected'
        return 'confirmed'
    }

    if (!currentUser?.roles.includes('admin')) {
        return null
    }

    const isFiltering = search !== debouncedSearch

    return (
        <div className="flex flex-col min-h-screen" style={{ background: '#f8faff' }}>
            <Topbar title="COD Verifications" description="Verify cash on delivery orders via phone calls" />

            <div className="flex-1 px-4 md:px-8 py-4 md:py-6 max-w-[1440px] mx-auto w-full space-y-5 md:space-y-6">

                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}>
                                <PhoneCall className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.03em' }}>
                                COD Verification Queue
                            </h1>
                        </div>
                        <p className="text-sm md:text-base" style={{ color: '#6b7280' }}>
                            Call customers to verify COD orders before processing
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <StatCard
                        label="Total COD Orders"
                        value={totalCod}
                        icon={
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#eef2ff' }}>
                                <Package className="w-5 h-5" style={{ color: '#2b4bb9' }} />
                            </div>
                        }
                    />
                    <StatCard
                        label="Pending Verification"
                        value={pendingVerification}
                        icon={
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fff8e6' }}>
                                <Clock className="w-5 h-5" style={{ color: '#f59e0b' }} />
                            </div>
                        }
                    />
                    <StatCard
                        label="Verified Today"
                        value={todayConfirmed}
                        icon={
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                                <CheckCircle2 className="w-5 h-5" style={{ color: '#16a34a' }} />
                            </div>
                        }
                    />
                    <StatCard
                        label="Rejection Rate"
                        value={`${rejectionRate}%`}
                        icon={
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fef2f2' }}>
                                <Ban className="w-5 h-5" style={{ color: '#ef4444' }} />
                            </div>
                        }
                    />
                </div>

                {/* Filters bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: '#fff', border: '1px solid #f0f0f0' }}>
                    <div className="flex items-center gap-3 flex-1">
                        <Search className="w-4 h-4 shrink-0" style={{ color: '#9ca3af' }} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by order ID, customer name, email, or phone..."
                            className="flex-1 text-sm outline-none"
                            style={{ background: 'transparent', color: '#0f172a' }}
                        />
                        {isFiltering && (
                            <div className="flex items-center gap-2 text-xs shrink-0" style={{ color: '#9ca3af' }}>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Searching...
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Select
                            value={statusFilter}
                            onChange={handleStatusChange}
                            options={VERIFICATION_STATUS_OPTIONS}
                            width={200}
                        />
                        <DateFilter
                            value={dateFilter}
                            onChange={handleDateFilterChange}
                            className="min-w-[200px]"
                        />
                    </div>
                </div>

                {/* Orders table */}
                <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #f0f0f0' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: '#fafbff', borderBottom: '1px solid #f4f5ff' }}>
                                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Order ID</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Time</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Customer</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Phone</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Product</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Affiliate</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Amount</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Status</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedOrders.map((order) => {
                                    const aff = DUMMY_AFFILIATES.find(a => a.affiliateCode === order.affiliateCode)
                                    const product = DUMMY_PRODUCTS.find(p => p.id === order.productId)
                                    const verificationStatus = getVerificationStatus(order.status)

                                    return (
                                        <tr
                                            key={order.id}
                                            className="cursor-pointer transition-all"
                                            style={{ borderBottom: '1px solid #f4f5ff' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbff')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <td className="py-4 px-6">
                                                <span className="text-xs font-mono font-bold" style={{ color: '#2b4bb9' }}>
                                                    {order.id.slice(0, 12)}...
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-medium" style={{ color: '#0f172a' }}>
                                                    {formatRelative(new Date(order.createdAt), new Date())}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div>
                                                    <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{order.customerName}</p>
                                                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{order.customerEmail}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <a
                                                    href={`tel:${order.customerPhone}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors hover:bg-[#eef2ff]"
                                                    style={{ color: '#2b4bb9' }}
                                                >
                                                    <Phone className="w-3 h-3" />
                                                    {order.customerPhone}
                                                </a>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2.5">
                                                    {product && (
                                                        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#f1f5f9' }}>
                                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate" style={{ color: '#0f172a' }}>
                                                            {product?.name || order.productName}
                                                        </p>
                                                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Qty: {order.quantity ?? 1}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {order.affiliateCode && aff ? (
                                                    <div className="flex items-center gap-2">
                                                        <AffiliateAvatar name={aff.fullName} />
                                                        <span className="text-sm font-medium" style={{ color: '#0f172a' }}>{aff.fullName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs italic" style={{ color: '#9ca3af' }}>Direct</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-bold tabular-nums" style={{ color: '#2b4bb9' }}>
                                                    NRP {order.total.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <StatusBadge status={verificationStatus} />
                                            </td>
                                            <td className="py-4 px-6">
                                                {verificationStatus === 'pending' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setSelectedOrder(order)
                                                        }}
                                                        className="px-3.5 py-2 rounded-lg text-xs font-bold text-white transition-all hover:shadow-lg"
                                                        style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
                                                    >
                                                        <PhoneCall className="w-3.5 h-3.5 inline mr-1.5" />
                                                        Verify
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}

                                {paginatedOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-16 text-center">
                                            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#9ca3af' }} />
                                            <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>
                                                {isFiltering ? 'Searching...' : 'No COD orders match your filters.'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {paginatedOrders.length > 0 && (
                        <Pagination
                            page={safePage}
                            totalPages={totalPages}
                            total={filteredOrders.length}
                            pageSize={PAGE_SIZE}
                            onChange={handlePage}
                        />
                    )}
                </div>
            </div>

            {selectedOrder && selectedOrder.status === 'awaiting_verification' && (
                <CodVerificationModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            )}
        </div>
    )
}
