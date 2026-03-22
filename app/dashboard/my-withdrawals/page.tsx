'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/lib/store'
import { Topbar } from '@/components/layout/Topbar'
import { DUMMY_WITHDRAWALS, DUMMY_AFFILIATES, DUMMY_EARNINGS } from '@/lib/dummy-data'
import type { Withdrawal } from '@/lib/types'
import {
  Banknote, Clock, CheckCircle, XCircle, Plus, X,
  ChevronDown, Image as ImageIcon, AlertCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const USER_TO_AFFILIATE: Record<string, string> = {
  u2: 'af1',
  u3: 'af2',
}

// ── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: Withdrawal['status'] }) {
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: '#f0fdf4', color: '#15803d' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
      Approved
    </span>
  )
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: '#fef2f2', color: '#b91c1c' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
      Rejected
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: '#fffbeb', color: '#b45309' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
      Pending
    </span>
  )
}

// ── Request Modal ─────────────────────────────────────────────────────────────
function RequestModal({
  available,
  affiliate,
  onClose,
  onSubmit,
}: {
  available: number
  affiliate: { bankName: string; accountNumber: string } | null
  onClose: () => void
  onSubmit: (amount: number) => void
}) {
  const [amount, setAmount] = useState('')
  const [done, setDone] = useState(false)
  const val = parseFloat(amount)
  const isValid = !isNaN(val) && val > 0 && val <= available

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    onSubmit(val)
    setDone(true)
    setTimeout(onClose, 1600)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(19,27,46,0.45)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl animate-fade-in-up overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 32px 80px rgba(19,27,46,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#0f172a', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              Request Withdrawal
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Funds will be sent to your registered bank</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#f1f5f9]" style={{ color: '#6b7280' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <CheckCircle className="w-7 h-7" style={{ color: '#16a34a' }} />
            </div>
            <p className="text-base font-bold" style={{ color: '#0f172a' }}>Request Submitted!</p>
            <p className="text-sm text-center" style={{ color: '#6b7280' }}>Your withdrawal request is now pending admin review.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Available balance */}
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: '#f8faff' }}>
              <div>
                <p className="text-xs uppercase tracking-widest font-bold mb-0.5" style={{ color: '#9ca3af' }}>Available Balance</p>
                <p className="text-2xl font-bold" style={{ color: '#0f172a', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
                  ${available.toFixed(2)}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#eef2ff' }}>
                <Banknote className="w-5 h-5" style={{ color: '#2b4bb9' }} />
              </div>
            </div>

            {/* Bank info */}
            {affiliate && (
              <div className="rounded-xl px-4 py-3 space-y-0.5" style={{ background: '#f4f5ff', border: '1px solid #dbeafe' }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6b7280' }}>Payout to</p>
                <p className="text-sm font-semibold mt-1" style={{ color: '#0f172a' }}>{affiliate.bankName}</p>
                <p className="text-xs font-mono" style={{ color: '#6b7280' }}>{affiliate.accountNumber}</p>
              </div>
            )}

            {/* Amount input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9ca3af' }}>
                Withdraw Amount (USD)
              </label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: '#fff', border: '1.5px solid #e2e8f0' }}
                onFocus={() => { }} >
                <span className="text-base font-semibold" style={{ color: '#9ca3af' }}>$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  max={available}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 text-base font-semibold bg-transparent outline-none"
                  style={{ color: '#0f172a' }}
                />
                <button
                  type="button"
                  onClick={() => setAmount(available.toFixed(2))}
                  className="text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ background: '#eef2ff', color: '#2b4bb9' }}
                >
                  Max
                </button>
              </div>
              {amount && !isValid && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#dc2626' }}>
                  <AlertCircle className="w-3 h-3" />
                  {val > available ? `Exceeds available balance ($${available.toFixed(2)})` : 'Enter a valid amount'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
            >
              Submit Request
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ item, onClose }: { item: Withdrawal; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(19,27,46,0.45)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ background: '#fff', boxShadow: '0 32px 80px rgba(19,27,46,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#0f172a', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              Withdrawal Detail
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>ID: {item.id.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#f1f5f9]" style={{ color: '#6b7280' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount + status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: '#9ca3af' }}>Amount Requested</p>
              <p className="text-3xl font-bold" style={{ color: '#0f172a', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
                ${item.amount.toFixed(2)}
              </p>
            </div>
            <StatusPill status={item.status} />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: '#f8faff' }}>
              <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: '#9ca3af' }}>Requested</p>
              <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                {new Date(item.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            {item.processedAt && (
              <div className="rounded-xl p-3" style={{ background: '#f8faff' }}>
                <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: '#9ca3af' }}>Processed</p>
                <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                  {new Date(item.processedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Approved: note + screenshot */}
          {item.status === 'approved' && (
            <>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} />
                <span className="text-sm font-semibold" style={{ color: '#15803d' }}>Payment has been approved and processed.</span>
              </div>
              {item.remarks && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Admin Note</p>
                  <p className="text-sm leading-relaxed px-4 py-3 rounded-xl" style={{ background: '#f8faff', color: '#374151', border: '1px solid #f1f5f9' }}>
                    {item.remarks}
                  </p>
                </div>
              )}
              {item.paymentScreenshot ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Payment Screenshot</p>
                  <img
                    src={item.paymentScreenshot}
                    alt="Payment confirmation"
                    className="w-full rounded-xl object-cover"
                    style={{ border: '1px solid #f1f5f9', maxHeight: '200px' }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#f8faff', border: '1px dashed #e2e8f0' }}>
                  <ImageIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#9ca3af' }} />
                  <span className="text-sm" style={{ color: '#9ca3af' }}>No payment screenshot provided by admin.</span>
                </div>
              )}
            </>
          )}

          {/* Rejected: note only */}
          {item.status === 'rejected' && (
            <>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: '#fef2f2', border: '1.5px solid #fca5a5' }}>
                <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#dc2626' }} />
                <span className="text-sm font-semibold" style={{ color: '#b91c1c' }}>This request was rejected.</span>
              </div>
              {item.remarks ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Rejection Reason</p>
                  <p className="text-sm leading-relaxed px-4 py-3 rounded-xl" style={{ background: '#f8faff', color: '#374151', border: '1px solid #f1f5f9' }}>
                    {item.remarks}
                  </p>
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#9ca3af' }}>No reason provided by admin.</p>
              )}
            </>
          )}

          {/* Pending */}
          {item.status === 'pending' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
              <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#b45309' }} />
              <span className="text-sm font-semibold" style={{ color: '#92400e' }}>Awaiting admin review. You will be notified once processed.</span>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold hover:bg-[#f1f5f9] transition-colors"
            style={{ background: '#f8faff', color: '#6b7280' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyWithdrawalsPage() {
  const { currentUser } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (currentUser && !currentUser.roles.includes('vendor')) {
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  const affiliateId = currentUser ? USER_TO_AFFILIATE[currentUser.id] : null
  const affiliate = DUMMY_AFFILIATES.find(a => a.id === affiliateId) ?? null

  // Calculate available balance from paid earnings minus approved withdrawals
  const totalEarned = DUMMY_EARNINGS
    .filter(e => e.affiliateId === affiliateId && e.status === 'paid')
    .reduce((s, e) => s + e.commissionAmount, 0)

  const totalWithdrawn = DUMMY_WITHDRAWALS
    .filter(w => w.affiliateId === affiliateId && w.status === 'approved')
    .reduce((s, w) => s + w.amount, 0)

  const available = Math.max(0, totalEarned - totalWithdrawn)

  // Local state to allow new requests to appear
  const [localWithdrawals, setLocalWithdrawals] = useState<Withdrawal[]>(
    DUMMY_WITHDRAWALS.filter(w => w.affiliateId === affiliateId)
  )

  const [showRequest, setShowRequest] = useState(false)
  const [detailItem, setDetailItem] = useState<Withdrawal | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | Withdrawal['status']>('all')

  const filtered = useMemo(() =>
    statusFilter === 'all'
      ? localWithdrawals
      : localWithdrawals.filter(w => w.status === statusFilter),
    [localWithdrawals, statusFilter]
  )

  // Stats
  const pending  = localWithdrawals.filter(w => w.status === 'pending').length
  const approved = localWithdrawals.filter(w => w.status === 'approved').length
  const rejected = localWithdrawals.filter(w => w.status === 'rejected').length
  const totalRequested = localWithdrawals.reduce((s, w) => s + w.amount, 0)

  function handleNewRequest(amount: number) {
    const newW: Withdrawal = {
      id: `w${Date.now()}`,
      affiliateId: affiliateId ?? '',
      amount,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    }
    setLocalWithdrawals(prev => [newW, ...prev])
  }

  const STATS = [
    { label: 'Available Balance', value: `$${available.toFixed(2)}`, icon: Banknote, bg: '#eef2ff', color: '#2b4bb9' },
    { label: 'Pending Requests', value: pending, icon: Clock, bg: '#fffbeb', color: '#b45309' },
    { label: 'Approved', value: approved, icon: CheckCircle, bg: '#f0fdf4', color: '#16a34a' },
    { label: 'Rejected', value: rejected, icon: XCircle, bg: '#fef2f2', color: '#dc2626' },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--surface-container-lowest)' }}>
      <Topbar title="Withdrawal Requests" description="Manage your withdrawal requests and track payment status" />

      <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-6 max-w-[1440px]">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {STATS.map(s => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', border: '1px solid #f1f5f9' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>{s.label}</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: '#0f172a', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                    {s.value}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Toolbar */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', border: '1px solid #f1f5f9' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid #f4f5ff' }}>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>Request History</h2>
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{filtered.length} request{filtered.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Status filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="appearance-none pl-3.5 pr-8 py-2 rounded-xl text-sm font-medium outline-none"
                  style={{ background: '#f8faff', color: '#374151', border: '1px solid #f1f5f9' }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
              </div>

              <button
                onClick={() => setShowRequest(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
              >
                <Plus className="w-4 h-4" />
                New Request
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#fafbff', borderBottom: '1px solid #f4f5ff' }}>
                  {['Request ID', 'Amount', 'Requested On', 'Processed On', 'Status', 'Action'].map(h => (
                    <th key={h} className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f4f5ff' }}>
                          <Banknote className="w-5 h-5" style={{ color: '#9ca3af' }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: '#6b7280' }}>No withdrawal requests found</p>
                        <button
                          onClick={() => setShowRequest(true)}
                          className="text-sm font-semibold"
                          style={{ color: '#2b4bb9' }}
                        >
                          Make your first request
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(w => (
                  <tr
                    key={w.id}
                    style={{ borderBottom: '1px solid #f4f5ff' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="py-5 px-6">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg" style={{ background: '#eef2ff', color: '#2b4bb9' }}>
                        {w.id.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-sm font-bold tabular-nums" style={{ color: '#0f172a' }}>
                        ${w.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-sm" style={{ color: '#6b7280' }}>
                        {new Date(w.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-sm" style={{ color: '#6b7280' }}>
                        {w.processedAt
                          ? new Date(w.processedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <StatusPill status={w.status} />
                    </td>
                    <td className="py-5 px-6">
                      <button
                        onClick={() => setDetailItem(w)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#eef2ff]"
                        style={{ color: '#2b4bb9' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRequest && (
        <RequestModal
          available={available}
          affiliate={affiliate}
          onClose={() => setShowRequest(false)}
          onSubmit={handleNewRequest}
        />
      )}
      {detailItem && (
        <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      )}
    </div>
  )
}
