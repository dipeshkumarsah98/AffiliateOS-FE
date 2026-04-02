'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Topbar } from '@/components/layout/Topbar'
import { DUMMY_ORDERS, DUMMY_AFFILIATES } from '@/lib/dummy-data'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import type { Order, OrderStatus } from '@/lib/types'
import { Search, Package, X, MapPin, CreditCard, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const USER_TO_AFFILIATE: Record<string, string> = {
  u2: 'af1',
  u3: 'af2',
}

const ALL_STATUSES: (OrderStatus | 'all')[] = ['all', 'pending', 'processing', 'shipped', 'completed', 'awaiting_verification', 'cancelled']

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(19,27,46,0.5)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl my-8 animate-fade-in-up"
        style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 24px 60px rgba(19,27,46,0.18)' }}
      >
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(195,197,220,0.2)' }}>
          <div>
            <p className="font-mono text-sm font-bold" style={{ color: 'var(--primary)' }}>{order.id}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
              {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-container-high)]" style={{ color: 'var(--on-surface-variant)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium" style={{ background: order.paymentMethod === 'cod' ? 'var(--warning-container)' : 'var(--primary-fixed)', color: order.paymentMethod === 'cod' ? 'var(--on-warning-container)' : 'var(--on-primary-fixed)' }}>
              {order.paymentMethod.toUpperCase()}
            </span>
          </div>

          {/* Customer */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--surface-container-low)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--on-surface-variant)' }}>Customer</p>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Name</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Email</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{order.customerEmail}</span>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--on-surface-variant)' }}>Items</p>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.productId} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: 'var(--surface-container-low)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{item.productName}</p>
                    <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment summary */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--surface-container-low)' }}>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Subtotal</span>
              <span className="text-xs" style={{ color: 'var(--on-surface)' }}>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.affiliateDiscount && order.affiliateDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Affiliate Discount ({order.affiliateCode})</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--tertiary)' }}>-${order.affiliateDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(195,197,220,0.2)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Total</span>
              <span className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyOrdersPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (currentUser && !currentUser.roles.includes('vendor')) {
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  if (!currentUser?.roles.includes('vendor')) {
    return null
  }

  const affiliateId = USER_TO_AFFILIATE[currentUser.id]
  const affiliate = DUMMY_AFFILIATES.find(a => a.id === affiliateId)
  const myOrders = DUMMY_ORDERS.filter(o => affiliate && o.affiliateCode === affiliate.affiliateCode)

  const filtered = myOrders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="My Orders" description={`Orders placed using ${affiliate?.affiliateCode ?? 'your affiliate code'}`} />

      <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-6 max-w-[1440px]">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Total Orders', value: myOrders.length },
            { label: 'Completed', value: myOrders.filter(o => o.status === 'completed').length },
            { label: 'In Progress', value: myOrders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length },
            { label: 'Total Value', value: `$${myOrders.reduce((s, o) => s + o.total, 0).toFixed(2)}` },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div
            className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg"
            style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--on-surface-variant)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order ID or customer name..."
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: 'var(--on-surface)' }}
            />
          </div>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface-container-high)' }}>
            {(['all', 'pending', 'processing', 'shipped', 'completed', 'cancelled'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
                style={statusFilter === s
                  ? { background: 'var(--surface-container-lowest)', color: 'var(--primary)', boxShadow: '0 1px 4px rgba(19,27,46,0.08)' }
                  : { color: 'var(--on-surface-variant)' }
                }
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}>
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--on-surface-variant)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                {myOrders.length === 0 ? 'No orders via your affiliate link yet' : 'No orders match your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(195,197,220,0.15)' }}>
                    {['Order ID', 'Customer', 'Payment', 'Items', 'Discount Applied', 'Total', 'Status', 'Date', ''].map(h => (
                      <th key={h} className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(195,197,220,0.1)' }}>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-sm font-semibold" style={{ color: 'var(--primary)' }}>{order.id}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{order.customerName}</p>
                        <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{order.customerEmail}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ background: order.paymentMethod === 'cod' ? 'var(--warning-container)' : 'var(--primary-fixed)', color: order.paymentMethod === 'cod' ? 'var(--on-warning-container)' : 'var(--on-primary-fixed)' }}>
                          {order.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm" style={{ color: 'var(--on-surface)' }}>{order.items.length}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {order.affiliateDiscount && order.affiliateDiscount > 0 ? (
                          <span className="text-sm font-semibold" style={{ color: 'var(--tertiary)' }}>-${order.affiliateDiscount.toFixed(2)}</span>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>${order.total.toFixed(2)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--primary)', background: 'var(--primary-fixed)' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-6 py-3.5" style={{ borderTop: '1px solid rgba(195,197,220,0.15)' }}>
            <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              Showing {filtered.length} of {myOrders.length} orders
            </span>
          </div>
        </div>
      </div>

      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  )
}
