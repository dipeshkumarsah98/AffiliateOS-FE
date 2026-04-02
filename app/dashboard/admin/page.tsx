'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Topbar } from '@/components/layout/Topbar'
import { DUMMY_ORDERS, DUMMY_PRODUCTS, DUMMY_AFFILIATES } from '@/lib/dummy-data'
import type { Order, Product, OrderStatus } from '@/lib/types'
import {
  ShieldOff, X, Check, XCircle, ChevronDown, Package, ClipboardList,
  Search, Edit2, AlertCircle, ChevronLeft, ChevronRight, Filter,
  ArrowDown, Download, Plus, Pencil, Eye,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// ─── Helpers ────────────────────────────────────────────────────────────────

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
  shipped: { bg: '#eef2ff', color: '#3730a3', dot: '#6366f1' },
  completed: { bg: '#f0fdf4', color: '#166534', dot: '#16a34a' },
  cancelled: { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
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

// ─── Select ──────────────────────────────────────────────────────────────────

function Select({ value, onChange, options, width = 160 }: {
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
        className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl text-sm font-medium outline-none"
        style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#374151' }}
        onFocus={e => (e.currentTarget.style.borderColor = '#2b4bb9')}
        onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#9ca3af' }} />
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 8

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
        {/* ── LEFT PANEL: Order Details ── */}
        <div className="flex-1 min-w-0 p-5 sm:p-8 flex flex-col gap-6">
          {/* Header */}
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
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
              {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm" style={{ color: '#6b7280' }}>{order.productName}</span>
                  <span className="text-sm font-bold" style={{ color: '#0f172a' }}>${order.total.toFixed(2)}</span>
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
                ${order.total.toFixed(2)}
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
                    <Link2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#2b4bb9' }} />
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

// ─── Update Status Modal ──────────────────────────────────────────────────────

function UpdateStatusModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const statuses: OrderStatus[] = ['pending', 'awaiting_verification', 'processing', 'shipped', 'completed', 'cancelled']
  const [selected, setSelected] = useState<OrderStatus>(order.status)
  const [done, setDone] = useState(false)

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setDone(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(19,27,46,0.5)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl animate-fade-in-up"
        style={{ background: '#ffffff', boxShadow: '0 24px 60px rgba(19,27,46,0.18)' }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid #f4f5ff' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>Update Status</h2>
            <p className="text-xs mt-0.5 font-mono" style={{ color: '#6b7280' }}>{order.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f4f5ff]" style={{ color: '#6b7280' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#f0fdf4' }}>
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-bold" style={{ color: '#0f172a' }}>Status Updated</p>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>New Status</label>
              <div className="relative">
                <select value={selected} onChange={e => setSelected(e.target.value as OrderStatus)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none pr-10 font-medium"
                  style={{ background: '#f8faff', color: '#0f172a', border: '2px solid transparent' }}
                  onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.35)'; e.currentTarget.style.background = '#fff' }}
                  onBlur={e => { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.background = '#f8faff' }}>
                  {statuses.map(s => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9ca3af' }} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-[#f4f5ff]"
                style={{ background: '#f8faff', color: '#374151' }}>Cancel</button>
              <button type="submit"
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}>Update</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type AdminTab = 'cod' | 'orders' | 'products'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'awaiting_verification', label: 'Awaiting' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'completed', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const router = useRouter()
  const [tab, setTab] = useState<AdminTab>('cod')

  // COD tab state
  const [codModal, setCodModal] = useState<Order | null>(null)
  const [codSearch, setCodSearch] = useState('')
  const [codPage, setCodPage] = useState(1)

  // Orders tab state
  const [updateModal, setUpdateModal] = useState<Order | null>(null)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatus, setOrderStatus] = useState('all')
  const [orderSortDir, setOrderSortDir] = useState<'asc' | 'desc'>('desc')
  const [orderPage, setOrderPage] = useState(1)

  // Products tab state
  const [productSearch, setProductSearch] = useState('')
  const [productPage, setProductPage] = useState(1)

  useEffect(() => {
    if (!currentUser?.roles.includes('admin')) router.replace('/dashboard')
  }, [currentUser, router])

  if (!currentUser?.roles.includes('admin')) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar title="Admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShieldOff className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: '#9ca3af' }} />
            <p style={{ color: '#9ca3af' }}>Access restricted to admins only.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── COD data ──
  const codOrders = DUMMY_ORDERS.filter(o => o.paymentMethod === 'cod' && o.status === 'awaiting_verification')
  const filteredCod = useMemo(() =>
    codOrders.filter(o =>
      o.id.toLowerCase().includes(codSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(codSearch.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(codSearch.toLowerCase())
    ), [codOrders, codSearch])
  const codTotalPages = Math.max(1, Math.ceil(filteredCod.length / PAGE_SIZE))
  const safeCodPage = Math.min(codPage, codTotalPages)
  const paginatedCod = filteredCod.slice((safeCodPage - 1) * PAGE_SIZE, safeCodPage * PAGE_SIZE)

  // ── Orders data ──
  const filteredOrders = useMemo(() => {
    let list = DUMMY_ORDERS.filter(o =>
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase())
    )
    if (orderStatus !== 'all') list = list.filter(o => o.status === orderStatus)
    list = [...list].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return orderSortDir === 'desc' ? -diff : diff
    })
    return list
  }, [orderSearch, orderStatus, orderSortDir])
  const orderTotalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const safeOrderPage = Math.min(orderPage, orderTotalPages)
  const paginatedOrders = filteredOrders.slice((safeOrderPage - 1) * PAGE_SIZE, safeOrderPage * PAGE_SIZE)

  // ── Products data ──
  const filteredProducts = useMemo(() =>
    DUMMY_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    ), [productSearch])
  const productTotalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const safeProductPage = Math.min(productPage, productTotalPages)
  const paginatedProducts = filteredProducts.slice((safeProductPage - 1) * PAGE_SIZE, safeProductPage * PAGE_SIZE)

  const tabs: { id: AdminTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'cod', label: 'COD Verification', icon: AlertCircle, count: codOrders.length },
    { id: 'orders', label: 'Order Management', icon: ClipboardList },
    { id: 'products', label: 'Product Management', icon: Package },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f8faff' }}>
      <Topbar title="Admin Panel" description="Manage orders, products, and COD verification" />

      <div className="flex-1 px-4 md:px-8 py-4 md:py-6 max-w-[1440px] space-y-4 md:space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              Admin Panel
            </h1>
            <p className="text-sm mt-1 hidden sm:block" style={{ color: '#6b7280' }}>
              Manage orders, COD verifications, and product inventory.
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold self-start flex-shrink-0"
            style={{ background: '#f4f5ff', color: '#2b4bb9', border: '1px solid #d0d9ff' }}
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: '#eef2ff' }}>
          {tabs.map(t => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0"
                style={isActive
                  ? { background: '#ffffff', color: '#2b4bb9', boxShadow: '0 2px 8px rgba(43,75,185,0.08)' }
                  : { color: '#6b7280' }}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-white"
                    style={{ background: '#ef4444' }}>
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ═══════════════ COD VERIFICATION TAB ═══════════════ */}
        {tab === 'cod' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search order ID or customer..."
                  value={codSearch}
                  onChange={e => { setCodSearch(e.target.value); setCodPage(1) }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#374151' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#2b4bb9')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                />
              </div>
              <button className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#eff3ff', border: '1px solid #d0d9ff' }}>
                <Filter className="w-4 h-4" style={{ color: '#2b4bb9' }} />
              </button>
            </div>

            {/* Table card */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #f1f5f9' }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f4f5ff' }}>
                <div>
                  <h3 className="text-base font-bold" style={{ color: '#0f172a', letterSpacing: '-0.01em' }}>Pending COD Orders</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{codOrders.length} orders awaiting customer confirmation</p>
                </div>
              </div>

              {paginatedCod.length === 0 ? (
                <div className="py-20 text-center">
                  <Check className="w-10 h-10 mx-auto mb-3 opacity-30 text-green-500" />
                  <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>All COD orders verified</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f4f5ff', background: '#fafbff' }}>
                        {['Order ID', 'Customer', 'Email', 'Phone', 'Amount', 'Status', 'Actions'].map(h => (
                          <th key={h} className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCod.map((order, idx) => (
                        <tr
                          key={order.id}
                          style={{ borderBottom: idx === paginatedCod.length - 1 ? 'none' : '1px solid #f4f5ff' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          className="transition-colors"
                        >
                          <td className="py-5 px-6">
                            <span className="font-mono text-sm font-bold" style={{ color: '#2b4bb9' }}>{order.id}</span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>{order.customerName}</span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-sm" style={{ color: '#374151' }}>{order.customerEmail}</span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-sm" style={{ color: '#374151' }}>{order.customerPhone}</span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-sm font-bold" style={{ color: '#0f172a' }}>${order.total.toFixed(2)}</span>
                          </td>
                          <td className="py-5 px-6">
                            <StatusPill status={order.status} />
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setCodModal(order)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
                              >
                                <Check className="w-3.5 h-3.5" />
                                Verify
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {/* Skeleton filler */}
                      {paginatedCod.length > 0 && paginatedCod.length < PAGE_SIZE && (
                        <tr style={{ background: '#fafbff' }}>
                          {[80, 110, 160, 100, 60, 80, 80].map((w, i) => (
                            <td key={i} className="py-5 px-6">
                              <div className="h-3.5 rounded-full animate-pulse" style={{ background: '#f1f5f9', width: w }} />
                            </td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredCod.length > PAGE_SIZE && (
                <div style={{ borderTop: '1px solid #f4f5ff' }}>
                  <Pagination
                    page={safeCodPage} totalPages={codTotalPages}
                    total={filteredCod.length} pageSize={PAGE_SIZE}
                    onChange={p => setCodPage(p)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ ORDER MANAGEMENT TAB ═══════════════ */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search ID or customer..."
                  value={orderSearch}
                  onChange={e => { setOrderSearch(e.target.value); setOrderPage(1) }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#374151' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#2b4bb9')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                />
              </div>
              <Select
                value={orderStatus}
                onChange={v => { setOrderStatus(v); setOrderPage(1) }}
                options={STATUS_OPTIONS}
                width={160}
              />
              <button className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#eff3ff', border: '1px solid #d0d9ff' }}>
                <Filter className="w-4 h-4" style={{ color: '#2b4bb9' }} />
              </button>
            </div>

            {/* Table card */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #f1f5f9' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f4f5ff', background: '#fafbff' }}>
                      <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Order ID</th>
                      <th className="py-4 px-6 text-left">
                        <button
                          className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                          style={{ color: '#9ca3af' }}
                          onClick={() => { setOrderSortDir(d => d === 'desc' ? 'asc' : 'desc'); setOrderPage(1) }}
                        >
                          Date
                          <ArrowDown className="w-3 h-3" style={{ transform: orderSortDir === 'asc' ? 'rotate(180deg)' : 'none', color: '#2b4bb9', transition: 'transform 0.2s' }} />
                        </button>
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Customer</th>
                      <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Affiliate</th>
                      <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Payment</th>
                      <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Amount</th>
                      <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Status</th>
                      <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order, idx) => {
                      const aff = DUMMY_AFFILIATES.find(a => a.affiliateCode === order.affiliateCode)
                      const isDirect = !order.affiliateCode
                      return (
                        <tr
                          key={order.id}
                          className="transition-colors"
                          style={{ borderBottom: idx === paginatedOrders.length - 1 ? 'none' : '1px solid #f4f5ff' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="py-5 px-6">
                            <span className="text-sm font-bold font-mono" style={{ color: '#2b4bb9' }}>{order.id}</span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-sm" style={{ color: '#374151' }}>
                              {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <br />
                            <span className="text-xs" style={{ color: '#9ca3af' }}>
                              {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{order.customerName}</p>
                            <p className="text-xs" style={{ color: '#9ca3af' }}>{order.customerEmail}</p>
                          </td>
                          <td className="py-5 px-6">
                            {isDirect ? (
                              <span className="text-sm italic" style={{ color: '#9ca3af' }}>Direct</span>
                            ) : aff ? (
                              <div className="flex items-center gap-2">
                                <AffiliateAvatar name={aff.fullName} />
                                <span className="text-sm" style={{ color: '#374151' }}>{aff.fullName}</span>
                              </div>
                            ) : (
                              <span className="text-xs font-mono" style={{ color: '#9ca3af' }}>{order.affiliateCode}</span>
                            )}
                          </td>
                          <td className="py-5 px-6">
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-lg uppercase"
                              style={order.paymentMethod === 'cod'
                                ? { background: '#fff8e6', color: '#b45309' }
                                : { background: '#eff6ff', color: '#1d4ed8' }}
                            >
                              {order.paymentMethod}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-sm font-bold" style={{ color: '#0f172a' }}>${order.total.toFixed(2)}</span>
                          </td>
                          <td className="py-5 px-6">
                            <StatusPill status={order.status} />
                          </td>
                          <td className="py-5 px-6">
                            <button
                              onClick={() => setUpdateModal(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#eef2ff]"
                              style={{ color: '#2b4bb9' }}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Update
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {paginatedOrders.length > 0 && paginatedOrders.length < PAGE_SIZE && (
                      <tr style={{ background: '#fafbff' }}>
                        {[80, 80, 130, 100, 60, 60, 80, 80].map((w, i) => (
                          <td key={i} className="py-5 px-6">
                            <div className="h-3.5 rounded-full animate-pulse" style={{ background: '#f1f5f9', width: w }} />
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredOrders.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>No orders match your filters.</p>
                </div>
              )}

              <div style={{ borderTop: '1px solid #f4f5ff' }}>
                <Pagination
                  page={safeOrderPage} totalPages={orderTotalPages}
                  total={filteredOrders.length} pageSize={PAGE_SIZE}
                  onChange={p => setOrderPage(p)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ PRODUCT MANAGEMENT TAB ═══════════════ */}
        {tab === 'products' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search by name, category, SKU..."
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setProductPage(1) }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#374151' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#2b4bb9')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                />
              </div>
              <button className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#eff3ff', border: '1px solid #d0d9ff' }}>
                <Filter className="w-4 h-4" style={{ color: '#2b4bb9' }} />
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white ml-auto"
                style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {/* Table card */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #f1f5f9' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f4f5ff', background: '#fafbff' }}>
                      {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Availability', 'Commission', 'Actions'].map(h => (
                        <th key={h} className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product, idx) => (
                      <tr
                        key={product.id}
                        className="transition-colors"
                        style={{ borderBottom: idx === paginatedProducts.length - 1 ? 'none' : '1px solid #f4f5ff' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#eef2ff' }}>
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>{product.name}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-xs font-mono font-semibold" style={{ color: '#6b7280' }}>{product.sku}</span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                            style={{ background: '#f4f5ff', color: '#2b4bb9' }}>
                            {product.category}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-sm font-bold" style={{ color: '#0f172a' }}>${product.price.toFixed(2)}</span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums" style={{ color: product.stock === 0 ? '#ef4444' : '#0f172a' }}>
                              {product.stock.toLocaleString()}
                            </span>
                            {product.stock === 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: '#fef2f2', color: '#dc2626' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Out
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={product.available
                              ? { background: '#f0fdf4', color: '#166534' }
                              : { background: '#fef2f2', color: '#b91c1c' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: product.available ? '#16a34a' : '#ef4444' }} />
                            {product.available ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="text-sm font-bold" style={{ color: '#2b4bb9' }}>{product.commissionRate}%</span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-1.5">
                            <button
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#eef2ff]"
                              style={{ color: '#2b4bb9' }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#f4f5ff]"
                              style={{ color: '#6b7280' }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedProducts.length > 0 && paginatedProducts.length < PAGE_SIZE && (
                      <tr style={{ background: '#fafbff' }}>
                        {[180, 80, 80, 60, 60, 80, 50, 100].map((w, i) => (
                          <td key={i} className="py-5 px-6">
                            <div className="h-3.5 rounded-full animate-pulse" style={{ background: '#f1f5f9', width: w }} />
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>No products match your search.</p>
                </div>
              )}

              <div style={{ borderTop: '1px solid #f4f5ff' }}>
                <Pagination
                  page={safeProductPage} totalPages={productTotalPages}
                  total={filteredProducts.length} pageSize={PAGE_SIZE}
                  onChange={p => setProductPage(p)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {codModal && <CodVerificationModal order={codModal} onClose={() => setCodModal(null)} />}
      {updateModal && <UpdateStatusModal order={updateModal} onClose={() => setUpdateModal(null)} />}
    </div>
  )
}
