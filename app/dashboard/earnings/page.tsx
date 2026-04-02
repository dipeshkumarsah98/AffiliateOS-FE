'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Topbar } from '@/components/layout/Topbar'
import { DUMMY_EARNINGS, DUMMY_WITHDRAWALS, DUMMY_AFFILIATES } from '@/lib/dummy-data'
import { DollarSign, TrendingUp, Clock, CheckCircle, ShieldOff, ArrowUpRight, X, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Map user id → affiliate id (demo)
const USER_TO_AFFILIATE: Record<string, string> = {
  u2: 'af1',
  u3: 'af2',
}

function EarningsBadge({ status }: { status: 'pending' | 'paid' }) {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)' }}>
        <CheckCircle className="w-3 h-3" />
        Paid
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--warning-container)', color: 'var(--on-warning-container)' }}>
      <Clock className="w-3 h-3" />
      Pending
    </span>
  )
}

function WithdrawModal({ available, onClose }: { available: number; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [done, setDone] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0 || val > available) return
    setDone(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(19,27,46,0.5)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl animate-fade-in-up"
        style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 24px 60px rgba(19,27,46,0.18)' }}
      >
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(195,197,220,0.2)' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              Request Withdrawal
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
              Available: <strong>${available.toFixed(2)}</strong>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-container-high)]" style={{ color: 'var(--on-surface-variant)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--tertiary-container)' }}>
              <Check className="w-7 h-7" style={{ color: 'var(--tertiary)' }} />
            </div>
            <p className="font-bold" style={{ color: 'var(--on-surface)' }}>Withdrawal Requested!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>Your request has been sent to the admin for processing.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                Amount to Withdraw
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>$</span>
                <input
                  type="number"
                  min="1"
                  max={available}
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 rounded-lg text-sm outline-none transition-all font-semibold"
                  style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '2px solid transparent' }}
                  onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}
                  onBlur={e => { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
                />
              </div>
              <button
                type="button"
                onClick={() => setAmount(available.toFixed(2))}
                className="mt-1.5 text-xs font-medium"
                style={{ color: 'var(--primary)' }}
              >
                Withdraw all (${available.toFixed(2)})
              </button>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg text-sm font-semibold" style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > available}
                className="flex-1 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
              >
                Request Payout
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function EarningsPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const router = useRouter()
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [activeTab, setActiveTab] = useState<'commission' | 'withdrawals'>('commission')

  useEffect(() => {
    if (currentUser && !currentUser.roles.includes('vendor')) {
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  if (!currentUser?.roles.includes('vendor')) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar title="Earnings" />
        <div className="flex-1 flex items-center justify-center">
          <ShieldOff className="w-12 h-12 opacity-20" style={{ color: 'var(--on-surface-variant)' }} />
        </div>
      </div>
    )
  }

  const affiliateId = USER_TO_AFFILIATE[currentUser.id]
  const affiliate = DUMMY_AFFILIATES.find(a => a.id === affiliateId)
  const myEarnings = DUMMY_EARNINGS.filter(e => e.affiliateId === affiliateId)
  const myWithdrawals = DUMMY_WITHDRAWALS.filter(w => w.affiliateId === affiliateId)

  const totalEarnings = myEarnings.reduce((s, e) => s + e.commissionAmount, 0)
  const paidEarnings = myEarnings.filter(e => e.status === 'paid').reduce((s, e) => s + e.commissionAmount, 0)
  const pendingEarnings = myEarnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.commissionAmount, 0)
  const totalWithdrawn = myWithdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + w.amount, 0)
  const pendingWithdrawal = myWithdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0)
  const availableToWithdraw = Math.max(0, paidEarnings - totalWithdrawn)

  const thisMonth = myEarnings.filter(e => e.createdAt.startsWith('2024-03'))
  const thisMonthTotal = thisMonth.reduce((s, e) => s + e.commissionAmount, 0)

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Earnings" description="Track your affiliate commission and withdrawals" />

      <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-6 max-w-[1440px]">
        {/* Affiliate Code Banner */}
        {affiliate && (
          <div
            className="rounded-xl p-4 md:p-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white opacity-70 mb-1">Your Affiliate Code</p>
              <p className="text-2xl font-bold text-white font-mono" style={{ letterSpacing: '0.05em' }}>
                {affiliate.affiliateCode}
              </p>
              <p className="text-xs text-white opacity-60 mt-1">
                {affiliate.commissionType === 'percentage' ? `${affiliate.commissionValue}%` : `$${affiliate.commissionValue}`} commission per confirmed order
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white opacity-60 mb-1">This Month</p>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                ${thisMonthTotal.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          <div className="rounded-xl p-6" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: '#2b4bb922' }}>
              <DollarSign className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
              ${totalEarnings.toFixed(2)}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>Total Earned</p>
          </div>

          <div className="rounded-xl p-6" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: '#1a7a5b22' }}>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--tertiary)' }} />
            </div>
            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
              ${availableToWithdraw.toFixed(2)}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>Available to Withdraw</p>
          </div>

          <div className="rounded-xl p-6" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: '#b4530922' }}>
              <Clock className="w-5 h-5" style={{ color: 'var(--warning)' }} />
            </div>
            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>
              ${pendingEarnings.toFixed(2)}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>Pending Commission</p>
          </div>

          <div
            className="rounded-xl p-6 flex flex-col justify-between"
            style={{ background: 'var(--tertiary-container)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}
          >
            <div>
              <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-tertiary-container)', letterSpacing: '-0.03em' }}>
                ${totalWithdrawn.toFixed(2)}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--on-tertiary-container)', opacity: 0.8 }}>Total Withdrawn</p>
            </div>
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={availableToWithdraw <= 0}
              className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ background: 'var(--tertiary)' }}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Request Withdrawal
            </button>
          </div>
        </div>

        {/* Pending withdrawal notice */}
        {pendingWithdrawal > 0 && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'var(--warning-container)' }}>
            <Clock className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--warning)' }} />
            <p className="text-sm" style={{ color: 'var(--on-warning-container)' }}>
              <strong>${pendingWithdrawal.toFixed(2)}</strong> withdrawal is currently pending admin approval.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--surface-container-high)' }}>
          {[
            { id: 'commission' as const, label: 'Commission History' },
            { id: 'withdrawals' as const, label: 'Withdrawal History' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={activeTab === t.id
                ? { background: 'var(--surface-container-lowest)', color: 'var(--primary)', boxShadow: '0 2px 8px rgba(19,27,46,0.06)' }
                : { color: 'var(--on-surface-variant)' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Commission History Table */}
        {activeTab === 'commission' && (
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(195,197,220,0.15)' }}>
                    {['Order ID', 'Product', 'Order Total', 'Commission', 'Date', 'Status'].map(h => (
                      <th key={h} className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myEarnings.map(entry => (
                    <tr key={entry.id} style={{ borderBottom: '1px solid rgba(195,197,220,0.1)' }}>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-sm font-semibold" style={{ color: 'var(--primary)' }}>{entry.orderId}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm" style={{ color: 'var(--on-surface)' }}>{entry.productName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm" style={{ color: 'var(--on-surface)' }}>${entry.orderTotal.toFixed(2)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-bold" style={{ color: 'var(--tertiary)' }}>+${entry.commissionAmount.toFixed(2)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                          {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <EarningsBadge status={entry.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3.5 flex justify-between items-center" style={{ borderTop: '1px solid rgba(195,197,220,0.15)' }}>
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{myEarnings.length} entries</span>
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: 'var(--on-surface-variant)' }}>Total:</span>
                <span className="font-bold" style={{ color: 'var(--tertiary)' }}>${totalEarnings.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal History Table */}
        {activeTab === 'withdrawals' && (
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}>
            {myWithdrawals.length === 0 ? (
              <div className="py-16 text-center">
                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--on-surface-variant)' }} />
                <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(195,197,220,0.15)' }}>
                      {['ID', 'Amount', 'Requested', 'Processed', 'Status', 'Remarks'].map(h => (
                        <th key={h} className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myWithdrawals.map(w => (
                      <tr key={w.id} style={{ borderBottom: '1px solid rgba(195,197,220,0.1)' }}>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-sm" style={{ color: 'var(--on-surface-variant)' }}>{w.id.toUpperCase()}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>${w.amount.toFixed(2)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                            {new Date(w.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                            {w.processedAt ? new Date(w.processedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={
                              w.status === 'approved'
                                ? { background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)' }
                                : w.status === 'rejected'
                                  ? { background: 'var(--error-container)', color: 'var(--on-error-container)' }
                                  : { background: 'var(--warning-container)', color: 'var(--on-warning-container)' }
                            }
                          >
                            {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{w.remarks ?? '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showWithdraw && (
        <WithdrawModal available={availableToWithdraw} onClose={() => setShowWithdraw(false)} />
      )}
    </div>
  )
}
