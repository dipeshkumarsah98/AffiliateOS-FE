'use client'

import { useAuthStore } from '@/stores/auth-store'
import { Topbar } from '@/components/layout/Topbar'
import { DUMMY_ORDERS, DUMMY_EARNINGS, DUMMY_AFFILIATES, DUMMY_WITHDRAWALS } from '@/lib/dummy-data'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { TrendingUp, Package, ClipboardList, DollarSign, AlertCircle, Users, Clock } from 'lucide-react'
import type { Order } from '@/lib/types'
import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const CHART_DATA = [
  { month: 'Oct', revenue: 18400 },
  { month: 'Nov', revenue: 24100 },
  { month: 'Dec', revenue: 31800 },
  { month: 'Jan', revenue: 26500 },
  { month: 'Feb', revenue: 34200 },
  { month: 'Mar', revenue: 41600 },
]

function MetricCard({
  label, value, sub, icon: Icon, accent, variant = 'default',
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent: string; variant?: 'default' | 'featured'
}) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-4"
      style={{
        background: variant === 'featured'
          ? 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)'
          : 'var(--surface-container-lowest)',
        boxShadow: '0 2px 8px rgba(19,27,46,0.04)',
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: variant === 'featured' ? 'rgba(255,255,255,0.2)' : accent + '22' }}
        >
          <Icon className="w-5 h-5" style={{ color: variant === 'featured' ? 'white' : accent }} />
        </div>
        <TrendingUp className="w-4 h-4 opacity-30" style={{ color: variant === 'featured' ? 'white' : accent }} />
      </div>
      <div>
        <p
          className="text-3xl font-bold"
          style={{
            fontFamily: 'var(--font-display)',
            color: variant === 'featured' ? 'white' : 'var(--on-surface)',
            letterSpacing: '-0.03em',
          }}
        >
          {value}
        </p>
        <p className="text-sm mt-1" style={{ color: variant === 'featured' ? 'rgba(255,255,255,0.7)' : 'var(--on-surface-variant)' }}>
          {label}
        </p>
        {sub && (
          <p className="text-xs mt-0.5 opacity-60" style={{ color: variant === 'featured' ? 'white' : 'var(--on-surface-variant)' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

function RecentOrderRow({ order }: { order: Order }) {
  return (
    <tr style={{ borderBottom: '1px solid rgba(195,197,220,0.12)' }}>
      <td className="py-3.5 px-4">
        <span className="text-sm font-mono font-semibold" style={{ color: 'var(--primary)' }}>{order.id}</span>
      </td>
      <td className="py-3.5 px-4">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{order.customerName}</p>
          <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{order.customerEmail}</p>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <span
          className="text-xs capitalize px-2 py-0.5 rounded-full font-medium"
          style={{
            background: order.paymentMethod === 'cod' ? 'var(--warning-container)' : 'var(--primary-fixed)',
            color: order.paymentMethod === 'cod' ? 'var(--on-warning-container)' : 'var(--on-primary-fixed)',
          }}
        >
          {order.paymentMethod.toUpperCase()}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <StatusBadge status={order.status} />
      </td>
      <td className="py-3.5 px-4">
        <span className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
          ${order.total.toFixed(2)}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <Link
          href={`/dashboard/orders?id=${order.id}`}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--primary)', background: 'var(--primary-fixed)' }}
        >
          View
        </Link>
      </td>
    </tr>
  )
}

function AdminDashboard() {
  const totalOrders = DUMMY_ORDERS.length
  const totalRevenue = DUMMY_ORDERS.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0)
  const pendingCod = DUMMY_ORDERS.filter(o => o.status === 'awaiting_verification').length
  const activeAffiliates = DUMMY_AFFILIATES.filter(a => a.status === 'active').length
  const recentOrders = DUMMY_ORDERS.slice(0, 6)

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1440px]">
      {/* Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Total Orders" value={totalOrders.toString()} sub="All time" icon={ClipboardList} accent="#2b4bb9" />
        <MetricCard label="Revenue (Completed)" value={`$${(totalRevenue / 1000).toFixed(1)}K`} sub="Completed orders only" icon={TrendingUp} accent="#1a7a5b" />
        <MetricCard label="Active Affiliates" value={activeAffiliates.toString()} sub={`${DUMMY_AFFILIATES.length} total onboarded`} icon={Users} accent="#7c3aed" />
        <MetricCard label="Pending COD" value={pendingCod.toString()} sub="Awaiting verification" icon={AlertCircle} accent="#c0392b" />
      </div>

      {/* Chart + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-2 rounded-xl p-6"
          style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                Revenue Overview
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>Last 6 months</p>
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              $41.6K
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2b4bb9" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2b4bb9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-container-lowest)', border: 'none', borderRadius: '8px', boxShadow: '0 8px 24px rgba(19,27,46,0.1)', fontSize: 12 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2b4bb9" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}>
            <h3 className="text-sm font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              Order Breakdown
            </h3>
            {[
              { label: 'Completed', count: DUMMY_ORDERS.filter(o => o.status === 'completed').length, bg: 'var(--tertiary-container)', fg: 'var(--on-tertiary-container)' },
              { label: 'Processing', count: DUMMY_ORDERS.filter(o => o.status === 'processing').length, bg: 'var(--secondary-container)', fg: 'var(--on-secondary-container)' },
              { label: 'Shipped', count: DUMMY_ORDERS.filter(o => o.status === 'shipped').length, bg: 'var(--primary-fixed)', fg: 'var(--on-primary-fixed)' },
              { label: 'Pending COD', count: DUMMY_ORDERS.filter(o => o.status === 'awaiting_verification').length, bg: 'var(--warning-container)', fg: 'var(--on-warning-container)' },
              { label: 'Cancelled', count: DUMMY_ORDERS.filter(o => o.status === 'cancelled').length, bg: 'var(--error-container)', fg: 'var(--on-error-container)' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.fg }} />
                  <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{s.label}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.fg }}>
                  {s.count}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-5" style={{ background: 'var(--primary-fixed)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-60" style={{ color: 'var(--on-primary-fixed)' }}>This Month</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-primary-fixed)', letterSpacing: '-0.02em' }}>$41,600</p>
            <p className="text-xs mt-1 opacity-60" style={{ color: 'var(--on-primary-fixed)' }}>+21.6% vs February</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(195,197,220,0.2)' }}>
          <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
            Recent Orders
          </h3>
          <Link href="/dashboard/orders" className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(195,197,220,0.15)' }}>
                {['Order ID', 'Customer', 'Payment', 'Status', 'Amount', 'Date', ''].map(h => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => <RecentOrderRow key={order.id} order={order} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---- Vendor Dashboard ----
function VendorDashboard({ userId }: { userId: string }) {
  const affiliate = DUMMY_AFFILIATES.find(a => {
    const user = { 'u2': 'af1', 'u3': 'af2' } as Record<string, string>
    return a.id === user[userId]
  })

  const myEarnings = DUMMY_EARNINGS.filter(e => e.affiliateId === affiliate?.id)
  const myOrders = DUMMY_ORDERS.filter(o => affiliate && o.affiliateCode === affiliate.affiliateCode)
  const myWithdrawals = DUMMY_WITHDRAWALS.filter(w => w.affiliateId === affiliate?.id)

  const totalEarnings = myEarnings.reduce((s, e) => s + e.commissionAmount, 0)
  const paidOut = myEarnings.filter(e => e.status === 'paid').reduce((s, e) => s + e.commissionAmount, 0)
  const pendingPayout = myEarnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.commissionAmount, 0)
  const pendingWithdrawal = myWithdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0)

  const availableToWithdraw = paidOut - myWithdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + w.amount, 0)

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1440px]">
      {/* Affiliate code banner */}
      {affiliate && (
        <div
          className="rounded-xl p-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)', boxShadow: '0 4px 16px rgba(43,75,185,0.25)' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white opacity-70 mb-1">Your Affiliate Code</p>
            <p className="text-3xl font-bold text-white font-mono tracking-wide" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
              {affiliate.affiliateCode}
            </p>
            <p className="text-xs text-white opacity-60 mt-1">
              {affiliate.discountType === 'percentage' ? `${affiliate.discountValue}% discount` : `$${affiliate.discountValue} off`} for customers •{' '}
              {affiliate.commissionType === 'percentage' ? `${affiliate.commissionValue}%` : `$${affiliate.commissionValue}`} commission per sale
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-white opacity-60 mb-1">Status</div>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
            >
              {affiliate.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Total Earnings" value={`$${totalEarnings.toFixed(2)}`} sub="All commission earned" icon={DollarSign} accent="#2b4bb9" variant="featured" />
        <MetricCard label="Available to Withdraw" value={`$${Math.max(0, availableToWithdraw).toFixed(2)}`} sub="Ready for payout" icon={TrendingUp} accent="#1a7a5b" />
        <MetricCard label="Pending Commission" value={`$${pendingPayout.toFixed(2)}`} sub="Awaiting order completion" icon={Clock} accent="#b45309" />
        <MetricCard label="Orders via My Link" value={myOrders.length.toString()} sub="Confirmed purchases" icon={ClipboardList} accent="#7c3aed" />
      </div>

      {/* Pending withdrawal notice */}
      {pendingWithdrawal > 0 && (
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'var(--warning-container)' }}
        >
          <Clock className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--warning)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--on-warning-container)' }}>
              Withdrawal Pending
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--on-warning-container)', opacity: 0.8 }}>
              ${pendingWithdrawal.toFixed(2)} withdrawal request is being processed by the admin.
            </p>
          </div>
        </div>
      )}

      {/* Recent orders via link */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(195,197,220,0.2)' }}>
          <div>
            <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              Orders via My Link
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
              Orders placed using your affiliate code
            </p>
          </div>
          <Link href="/dashboard/my-orders" className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
            View all →
          </Link>
        </div>
        {myOrders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--on-surface-variant)' }} />
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>No orders yet via your affiliate link</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(195,197,220,0.15)' }}>
                  {['Order ID', 'Customer', 'Payment', 'Status', 'Amount', 'Date', ''].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myOrders.slice(0, 5).map(order => <RecentOrderRow key={order.id} order={order} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const isAdmin = currentUser?.roles.includes('admin')

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Dashboard"
        description={`Welcome back, ${currentUser?.name ?? 'Guest'}`}
      />
      {isAdmin
        ? <AdminDashboard />
        : <VendorDashboard userId={currentUser?.id ?? ''} />
      }
    </div>
  )
}
