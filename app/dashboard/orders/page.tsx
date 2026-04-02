'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Topbar } from '@/components/layout/Topbar'
import { DUMMY_ORDERS, DUMMY_AFFILIATES } from '@/lib/dummy-data'
import type { Order, OrderStatus } from '@/lib/types'
import {
  Search, X, ChevronLeft, ChevronRight, Download, PackagePlus,
  CheckCircle2, Truck, Package, Clock, XCircle, AlertCircle,
  MapPin, Link2, ChevronDown, Filter, ArrowDown,
} from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }) + ', ' + new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function fmtShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  }) + ', ' + new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  awaiting_verification: 'Awaiting',
  processing: 'Processing',
  shipped: 'Shipped',
  completed: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string; dot: string }> = {
  pending: { bg: '#fff8e6', color: '#b45309', dot: '#f59e0b' },
  awaiting_verification: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  processing: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' },
  shipped: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  completed: { bg: '#f0fdf4', color: '#166534', dot: '#16a34a' },
  cancelled: { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
}

// journey steps in order
const JOURNEY_STEPS: { status: string; label: string; icon: React.ElementType }[] = [
  { status: 'pending', label: 'Order Placed', icon: CheckCircle2 },
  { status: 'processing', label: 'Processing', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'completed', label: 'Delivered', icon: CheckCircle2 },
]

const STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'awaiting_verification', label: 'Awaiting' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'completed', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

function AffiliateAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = [
    ['#dbeafe', '#1d4ed8'], ['#dcfce7', '#166534'], ['#fce7f3', '#9d174d'],
    ['#fef9c3', '#92400e'], ['#ede9fe', '#6d28d9'], ['#fee2e2', '#991b1b'],
  ]
  const idx = name.charCodeAt(0) % colors.length
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0"
      style={{ background: colors[idx][0], color: colors[idx][1] }}
    >
      {initials}
    </span>
  )
}

function StatusPill({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {STATUS_LABEL[status]}
    </span>
  )
}

// ─── Order Detail Modal ──────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const affiliate = DUMMY_AFFILIATES.find(a => a.affiliateCode === order.affiliateCode)

  // Build journey: always show all 4 steps, mark completed/active ones
  const statusRank: Record<string, number> = {
    pending: 0, awaiting_verification: 0.5, processing: 1, shipped: 2, completed: 3, cancelled: -1,
  }
  const currentRank = statusRank[order.status] ?? 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(19,27,46,0.45)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ background: '#ffffff', boxShadow: '0 32px 80px rgba(19,27,46,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex">
          {/* ── LEFT PANEL ── */}
          <div className="flex-1 p-7 overflow-y-auto" style={{ maxHeight: '88vh' }}>
            {/* Status pill + close (mobile) */}
            <div className="flex items-center justify-between mb-4">
              <StatusPill status={order.status} />
              <button
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#f2f3ff', color: '#6b7280' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order heading */}
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#0f172a', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              Order #{order.id.replace('ORD-', 'EP-').replace('2024-', '')}
            </h2>
            <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
              {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>

            {/* Items Summary */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Items Summary</p>
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      style={{ border: '1px solid #f1f5f9' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>{item.productName}</p>
                      <p className="text-xs" style={{ color: '#9ca3af' }}>Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: '#0f172a' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 pt-4 space-y-1.5" style={{ borderTop: '1px solid #f1f5f9' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#6b7280' }}>Subtotal</span>
                  <span style={{ color: '#374151' }}>${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6b7280' }}>Discount</span>
                    <span style={{ color: '#16a34a' }}>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1">
                  <span style={{ color: '#0f172a' }}>Total</span>
                  <span style={{ color: '#0f172a' }}>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping + Affiliate side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Shipping Address</p>
                <p className="text-sm font-semibold mb-0.5" style={{ color: '#0f172a' }}>{order.customerName}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
                  {order.address.split(', ').map((line, i) => (
                    <span key={i}>{line}{i < order.address.split(', ').length - 1 ? <br /> : ''}</span>
                  ))}
                </p>
              </div>

              {order.affiliateCode && affiliate && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Affiliate Info</p>
                  <div className="p-3 rounded-xl" style={{ background: '#f8faff', border: '1px solid #e0e7ff' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Link2 className="w-3.5 h-3.5" style={{ color: '#2b4bb9' }} />
                      <span className="text-sm font-semibold" style={{ color: '#2b4bb9' }}>{affiliate.fullName}</span>
                    </div>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      Affiliate ID: #{affiliate.id.toUpperCase()}
                    </p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#16a34a' }}>
                      Comm: ${(order.affiliateDiscount ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div
            className="w-64 flex-shrink-0 flex flex-col p-7"
            style={{ background: '#fafbff', borderLeft: '1px solid #f1f5f9' }}
          >
            {/* Close button */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Order Journey</p>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: '#f1f5f9', color: '#6b7280' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Timeline */}
            <div className="flex-1 space-y-0">
              {JOURNEY_STEPS.map((step, idx) => {
                const stepRank = statusRank[step.status] ?? idx
                const isDone = currentRank >= stepRank && order.status !== 'cancelled'
                const isActive = order.status === step.status
                const histEntry = order.statusHistory.find(h => h.status === step.status)
                const Icon = step.icon

                return (
                  <div key={step.status} className="flex gap-3">
                    {/* dot + connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                        style={isDone
                          ? { background: isActive ? '#2b4bb9' : '#16a34a', boxShadow: isDone ? '0 0 0 4px rgba(43,75,185,0.12)' : 'none' }
                          : { background: '#f1f5f9', border: '2px solid #e2e8f0' }
                        }
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: isDone ? '#fff' : '#cbd5e1' }} />
                      </div>
                      {idx < JOURNEY_STEPS.length - 1 && (
                        <div
                          className="w-0.5 flex-1 my-1"
                          style={{
                            background: isDone && currentRank > stepRank ? '#16a34a' : '#e2e8f0',
                            minHeight: '28px',
                          }}
                        />
                      )}
                    </div>
                    {/* label */}
                    <div className="pb-6 pt-0.5">
                      <p className="text-sm font-semibold" style={{ color: isDone ? '#0f172a' : '#cbd5e1' }}>
                        {step.label}
                      </p>
                      {histEntry && (
                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                          {new Date(histEntry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},{' '}
                          {new Date(histEntry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {histEntry?.remark && (
                        <p className="text-xs font-medium mt-0.5" style={{ color: '#2b4bb9' }}>
                          {histEntry.remark}
                        </p>
                      )}
                      {!histEntry && !isDone && (
                        <p className="text-xs" style={{ color: '#cbd5e1' }}>Pending</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action buttons */}
            <div className="mt-auto space-y-2.5 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
              <button
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </button>
              <button
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: '#f8faff', color: '#374151', border: '1px solid #e2e8f0' }}
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, accent = false,
}: {
  label: string; value: string; sub?: string; icon?: React.ReactNode; accent?: boolean
}) {
  return (
    <div
      className="flex-1 min-w-0 p-5 rounded-2xl"
      style={{
        background: accent ? 'linear-gradient(135deg, #eff3ff 0%, #e8eeff 100%)' : '#ffffff',
        border: accent ? '1.5px solid #d0d9ff' : '1px solid #f1f5f9',
      }}
    >
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent ? '#2b4bb9' : '#9ca3af' }}>
        {label}
      </p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
            {value}
          </p>
          {sub && (
            <p className="text-xs mt-1 font-medium" style={{ color: accent ? '#2b4bb9' : '#9ca3af' }}>{sub}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">{icon}</div>
        )}
      </div>
    </div>
  )
}

// ─── Custom Select ────────────────────────────────────────────────────────────

function Select<T extends string>({
  value, onChange, options, width = 'auto',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  width?: string | number
}) {
  return (
    <div className="relative" style={{ width }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="appearance-none w-full pl-3 pr-8 py-2.5 rounded-xl text-sm font-medium outline-none"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          color: '#374151',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, pageSize, onChange }: {
  page: number; totalPages: number; total: number; pageSize: number; onChange: (p: number) => void
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

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <p className="text-sm" style={{ color: '#6b7280' }}>
        Showing <strong style={{ color: '#0f172a' }}>{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}</strong> of{' '}
        <strong style={{ color: '#0f172a' }}>{total}</strong> orders
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors hover:bg-gray-100"
          style={{ border: '1px solid #e2e8f0', color: '#374151', background: '#fff' }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#9ca3af' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className="w-8 h-8 rounded-lg text-sm font-semibold transition-all"
              style={page === p
                ? { background: '#2b4bb9', color: '#fff', boxShadow: '0 2px 8px rgba(43,75,185,0.35)' }
                : { background: '#fff', color: '#374151', border: '1px solid #e2e8f0' }
              }
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors hover:bg-gray-100"
          style={{ border: '1px solid #e2e8f0', color: '#374151', background: '#fff' }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5

export default function OrdersPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('id')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [affiliateFilter, setAffiliateFilter] = useState<string>('all')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(() =>
    highlightId ? (DUMMY_ORDERS.find(o => o.id === highlightId) ?? null) : null
  )

  // Stats
  const totalOrders = DUMMY_ORDERS.length
  const processing = DUMMY_ORDERS.filter(o => o.status === 'processing').length
  const grossRevenue = DUMMY_ORDERS.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const cancelled = DUMMY_ORDERS.filter(o => o.status === 'cancelled').length
  const cancellationRate = ((cancelled / totalOrders) * 100).toFixed(1)

  const affiliateOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All Affiliates' },
    ...DUMMY_AFFILIATES.map(a => ({ value: a.affiliateCode, label: a.fullName })),
    { value: 'direct', label: 'Direct Traffic' },
  ]

  const filtered = useMemo(() => {
    let list = DUMMY_ORDERS.filter(o => {
      const q = search.toLowerCase()
      const matchSearch = !q || o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      const matchAff = affiliateFilter === 'all'
        || (affiliateFilter === 'direct' && !o.affiliateCode)
        || o.affiliateCode === affiliateFilter
      return matchSearch && matchStatus && matchAff
    })
    list = [...list].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortDir === 'desc' ? -diff : diff
    })
    return list
  }, [search, statusFilter, affiliateFilter, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function handlePage(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)))
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f8faff' }}>
      <Topbar title="Orders" description="Track and manage all orders" />

      <div className="flex-1 px-4 md:px-8 py-4 md:py-6 max-w-[1440px] w-full space-y-4 md:space-y-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
          <div>
            <nav className="flex items-center gap-1.5 text-xs mb-2" style={{ color: '#9ca3af' }}>
              <span>Dashboard</span>
              <span>›</span>
              <span style={{ color: '#2b4bb9', fontWeight: 600 }}>Orders</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              Order Management
            </h1>
            <p className="text-sm mt-1 hidden sm:block" style={{ color: '#6b7280' }}>
              Track and manage all affiliate-driven transactions across your network.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 sm:mt-1 flex-shrink-0">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#374151' }}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            {currentUser?.roles.includes('admin') && (
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
              >
                <PackagePlus className="w-4 h-4" />
                Create Order
              </button>
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Total Orders"
            value={totalOrders.toLocaleString()}
            sub="+12% vs LW"
            accent
          />
          <StatCard
            label="Processing"
            value={String(processing)}
            icon={<div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#eff6ff' }}>
              <Package className="w-4 h-4" style={{ color: '#2b4bb9' }} /></div>}
          />
          <StatCard
            label="Gross Revenue"
            value={`$${(grossRevenue / 1000).toFixed(1)}k`}
            icon={<div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
            </div>}
          />
          <StatCard
            label="Cancellations"
            value={`${cancellationRate}%`}
            icon={<div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#fef2f2' }}>
              <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} /></div>}
          />
        </div>

        {/* ── Filters bar ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search ID or Customer..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                color: '#374151',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2b4bb9')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            />
          </div>

          {/* Status */}
          <Select
            value={statusFilter}
            onChange={v => { setStatusFilter(v); setPage(1) }}
            options={STATUS_OPTIONS}
            width={160}
          />

          {/* Date range placeholder */}
          <button
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#9ca3af', minWidth: 160 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Date Range
          </button>

          {/* Affiliate */}
          <Select
            value={affiliateFilter}
            onChange={v => { setAffiliateFilter(v); setPage(1) }}
            options={affiliateOptions}
            width={176}
          />

          {/* Filter icon */}
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#eff3ff', border: '1px solid #d0d9ff' }}
          >
            <Filter className="w-4 h-4" style={{ color: '#2b4bb9' }} />
          </button>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #f1f5f9' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th className="py-4 px-6 text-left">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Order ID</span>
                  </th>
                  <th className="py-4 px-6 text-left">
                    <button
                      className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
                      style={{ color: '#9ca3af' }}
                      onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                    >
                      Date
                      <ArrowDown
                        className="w-3 h-3 transition-transform"
                        style={{ transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none', color: '#2b4bb9' }}
                      />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-left">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Product Name</span>
                  </th>
                  <th className="py-4 px-6 text-left">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Customer Name</span>
                  </th>
                  <th className="py-4 px-6 text-left">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Affiliate Name</span>
                  </th>
                  <th className="py-4 px-6 text-left">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Total Price</span>
                  </th>
                  <th className="py-4 px-6 text-left">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Status</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((order, idx) => {
                  const aff = DUMMY_AFFILIATES.find(a => a.affiliateCode === order.affiliateCode)
                  const isDirect = !order.affiliateCode
                  const isLast = idx === paginated.length - 1

                  return (
                    <tr
                      key={order.id}
                      className="group transition-colors cursor-pointer"
                      style={{ borderBottom: isLast ? 'none' : '1px solid #f8faff' }}
                      onClick={() => setSelectedOrder(order)}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Order ID */}
                      <td className="py-4 px-6">
                        <span className="text-sm font-semibold" style={{ color: '#2b4bb9' }}>{order.id}</span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6">
                        <span className="text-sm" style={{ color: '#374151' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })},
                          <br />
                          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                            {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                        </span>
                      </td>

                      {/* Product */}
                      <td className="py-4 px-6">
                        <span className="text-sm font-medium" style={{ color: '#0f172a' }}>
                          {order.items[0]?.productName}
                          {order.items.length > 1 && (
                            <span className="ml-1 text-xs" style={{ color: '#9ca3af' }}>+{order.items.length - 1}</span>
                          )}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-6">
                        <span className="text-sm" style={{ color: '#374151' }}>{order.customerName}</span>
                      </td>

                      {/* Affiliate */}
                      <td className="py-4 px-6">
                        {isDirect ? (
                          <span className="text-sm italic" style={{ color: '#9ca3af' }}>Direct Traffic</span>
                        ) : aff ? (
                          <div className="flex items-center gap-2">
                            <AffiliateAvatar name={aff.fullName} />
                            <span className="text-sm" style={{ color: '#374151' }}>{aff.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-mono" style={{ color: '#9ca3af' }}>{order.affiliateCode}</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-4 px-6">
                        <span className="text-sm font-bold" style={{ color: '#0f172a' }}>${order.total.toFixed(2)}</span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <StatusPill status={order.status} />
                      </td>
                    </tr>
                  )
                })}

                {/* Skeleton row when less than PAGE_SIZE */}
                {paginated.length > 0 && paginated.length < PAGE_SIZE && (
                  <tr style={{ background: '#fafbff' }}>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <td key={i} className="py-4 px-6">
                        <div className="h-3 rounded-full animate-pulse" style={{ background: '#f1f5f9', width: ['80px', '60px', '140px', '100px', '120px', '60px', '80px'][i] }} />
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {paginated.length === 0 && (
            <div className="text-center py-20">
              <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>No orders match your filters.</p>
            </div>
          )}

          {/* Pagination */}
          <div style={{ borderTop: '1px solid #f1f5f9' }}>
            <Pagination
              page={safePage}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={handlePage}
            />
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  )
}
