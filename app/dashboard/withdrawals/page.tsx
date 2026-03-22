'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Banknote, Search, ChevronDown, Eye, Check, X,
  XCircle, Upload, ImageIcon, RefreshCw, Clock,
} from 'lucide-react'
import { DUMMY_WITHDRAWALS, DUMMY_AFFILIATES } from '@/lib/dummy-data'
import type { Withdrawal, Affiliate } from '@/lib/types'
import { Topbar } from '@/components/layout/Topbar'

// ─── Seed local state from dummy data ────────────────────────────────────────

type WithdrawalWithAffiliate = Withdrawal & { affiliate: Affiliate | undefined }

const INITIAL: WithdrawalWithAffiliate[] = DUMMY_WITHDRAWALS.map(w => ({
  ...w,
  affiliate: DUMMY_AFFILIATES.find(a => a.id === w.affiliateId),
}))

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Withdrawal['status'] }) {
  const map = {
    pending:  { bg: '#fff8e6', color: '#b45309', dot: '#f59e0b', label: 'Pending' },
    approved: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Approved' },
    rejected: { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444', label: 'Rejected' },
  }
  const s = map[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

// ─── Review Modal ──────────────────────────────────────────────────────────────

function ReviewModal({
  item,
  onClose,
  onUpdate,
}: {
  item: WithdrawalWithAffiliate
  onClose: () => void
  onUpdate: (id: string, status: 'approved' | 'rejected', remarks: string, screenshot?: string) => void
}) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | ''>('')
  const [remarks, setRemarks] = useState(item.remarks ?? '')
  const [screenshot, setScreenshot] = useState<string | undefined>(item.paymentScreenshot)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setScreenshot(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    if (!decision) return
    onUpdate(item.id, decision, remarks, screenshot)
    setDone(true)
    setTimeout(onClose, 1800)
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(19,27,46,0.5)', backdropFilter: 'blur(12px)' }}>
        <div className="w-full max-w-sm rounded-2xl p-10 text-center" style={{ background: '#fff', boxShadow: '0 24px 60px rgba(19,27,46,0.18)' }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: decision === 'approved' ? '#f0fdf4' : '#fef2f2' }}
          >
            {decision === 'approved'
              ? <Check className="w-8 h-8" style={{ color: '#16a34a' }} />
              : <XCircle className="w-8 h-8" style={{ color: '#dc2626' }} />}
          </div>
          <p className="text-lg font-bold" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
            Request {decision === 'approved' ? 'Approved' : 'Rejected'}
          </p>
          <p className="text-sm mt-1.5" style={{ color: '#6b7280' }}>
            Withdrawal #{item.id} has been {decision} successfully.
          </p>
        </div>
      </div>
    )
  }

  const af = item.affiliate

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(19,27,46,0.45)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full flex flex-col sm:flex-row overflow-hidden rounded-2xl"
        style={{ maxWidth: '800px', background: '#fff', boxShadow: '0 32px 80px rgba(19,27,46,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── LEFT: Withdrawal Details ── */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col gap-6">
          {/* Status + ID */}
          <div>
            <div className="mb-3">
              <StatusPill status={item.status} />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
              Withdrawal #{item.id}
            </h2>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
              Requested on {new Date(item.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
              {new Date(item.requestedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Amount */}
          <div className="rounded-2xl p-5" style={{ background: '#f8faff', border: '1px solid #eef2ff' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>Requested Amount</p>
            <p className="text-4xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>
              ${item.amount.toFixed(2)}
            </p>
          </div>

          {/* Affiliate info */}
          {af && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Affiliate</p>
              <div className="flex items-center gap-3.5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{ background: '#eef2ff', color: '#2b4bb9' }}
                >
                  {af.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{af.fullName}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{af.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{af.contactNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bank details */}
          {af && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Bank Details</p>
              <div className="space-y-2">
                {[
                  ['Bank', af.bankName],
                  ['Account', af.accountNumber],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #f4f5ff' }}>
                    <span className="text-xs" style={{ color: '#9ca3af' }}>{label}</span>
                    <span className="text-sm font-medium" style={{ color: '#0f172a' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── RIGHT: Action Panel ── */}
        <div
          className="sm:w-72 flex-shrink-0 flex flex-col p-5 sm:p-7 gap-5"
          style={{ background: '#fafbff', borderTop: '1px solid #f1f5f9' }}
        >
          {/* Header row with close */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>
              {item.status === 'pending' ? 'Review Decision' : 'Decision Record'}
            </p>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#f1f5f9]"
              style={{ color: '#6b7280' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── PENDING: show approve/reject form ── */}
          {item.status === 'pending' && (
            <>
              {/* Decision buttons */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: '#9ca3af' }}>Decision</p>
                <div className="space-y-2.5">
                  {([
                    { value: 'approved' as const, label: 'Approve payment', icon: Check,   activeBg: '#f0fdf4', activeBorder: '#86efac', color: '#16a34a' },
                    { value: 'rejected' as const, label: 'Reject request',  icon: XCircle, activeBg: '#fef2f2', activeBorder: '#fca5a5', color: '#dc2626' },
                  ] as const).map(opt => {
                    const Icon = opt.icon
                    const isSelected = decision === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDecision(opt.value)}
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
                        <span className="text-sm font-medium" style={{ color: isSelected ? opt.color : '#374151' }}>
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Payment screenshot — only when approving */}
              {decision === 'approved' && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Payment Screenshot</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                  {screenshot ? (
                    <div className="relative rounded-xl overflow-hidden" style={{ border: '1.5px solid #e2e8f0' }}>
                      <img src={screenshot} alt="Payment screenshot" className="w-full object-cover" style={{ maxHeight: '120px' }} />
                      <button
                        onClick={() => setScreenshot(undefined)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex flex-col items-center gap-2 py-5 rounded-xl transition-colors hover:bg-[#eef2ff]"
                      style={{ background: '#f8faff', border: '1.5px dashed #c7d2fe' }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#eef2ff' }}>
                        <Upload className="w-4 h-4" style={{ color: '#2b4bb9' }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: '#6b7280' }}>Upload screenshot</span>
                    </button>
                  )}
                </div>
              )}

              {/* Admin note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>
                  Note {decision === 'rejected' ? '(required)' : '(optional)'}
                </label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder={decision === 'rejected' ? 'Reason for rejection...' : 'Add a note for the affiliate...'}
                  rows={3}
                  className="w-full px-3.5 py-3 rounded-xl text-sm resize-none outline-none transition-all"
                  style={{ background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#2b4bb9')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                />
              </div>

              {/* Submit */}
              <div className="mt-auto space-y-2.5 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={handleSubmit}
                  disabled={!decision || (decision === 'rejected' && !remarks.trim())}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  style={{
                    background: decision === 'approved'
                      ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
                      : decision === 'rejected'
                      ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                      : 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)',
                  }}
                >
                  {decision === 'approved'
                    ? <><Check className="w-4 h-4" /> Approve & Mark Paid</>
                    : decision === 'rejected'
                    ? <><XCircle className="w-4 h-4" /> Reject Request</>
                    : 'Select a Decision'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f1f5f9]"
                  style={{ background: '#f8faff', color: '#6b7280' }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* ── APPROVED: show screenshot + note (read-only) ── */}
          {item.status === 'approved' && (
            <>
              <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl" style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}>
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} />
                <span className="text-sm font-semibold" style={{ color: '#15803d' }}>Payment Approved</span>
              </div>

              {item.processedAt && (
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  Processed on {new Date(item.processedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}

              {item.paymentScreenshot && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Payment Screenshot</p>
                  <img
                    src={item.paymentScreenshot}
                    alt="Payment screenshot"
                    className="w-full rounded-xl object-cover"
                    style={{ border: '1px solid #f1f5f9', maxHeight: '160px' }}
                  />
                </div>
              )}

              {item.remarks && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Admin Note</p>
                  <p className="text-sm leading-relaxed px-3.5 py-3 rounded-xl" style={{ background: '#fff', color: '#374151', border: '1.5px solid #e2e8f0' }}>
                    {item.remarks}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f1f5f9]"
                  style={{ background: '#f8faff', color: '#6b7280' }}
                >
                  Close
                </button>
              </div>
            </>
          )}

          {/* ── REJECTED: show note only (read-only) ── */}
          {item.status === 'rejected' && (
            <>
              <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl" style={{ background: '#fef2f2', border: '1.5px solid #fca5a5' }}>
                <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#dc2626' }} />
                <span className="text-sm font-semibold" style={{ color: '#b91c1c' }}>Request Rejected</span>
              </div>

              {item.processedAt && (
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  Processed on {new Date(item.processedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}

              {item.remarks ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Rejection Reason</p>
                  <p className="text-sm leading-relaxed px-3.5 py-3 rounded-xl" style={{ background: '#fff', color: '#374151', border: '1.5px solid #e2e8f0' }}>
                    {item.remarks}
                  </p>
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#9ca3af' }}>No reason was recorded.</p>
              )}

              <div className="mt-auto pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f1f5f9]"
                  style={{ background: '#f8faff', color: '#6b7280' }}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WithdrawalsPage() {
  const router = useRouter()
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithAffiliate[]>(INITIAL)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Withdrawal['status'] | 'all'>('all')
  const [selected, setSelected] = useState<WithdrawalWithAffiliate | null>(null)

  const stats = {
    total:    withdrawals.length,
    pending:  withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    totalAmount: withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0),
  }

  const filtered = withdrawals.filter(w => {
    const matchStatus = statusFilter === 'all' || w.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q
      || w.id.toLowerCase().includes(q)
      || w.affiliate?.fullName.toLowerCase().includes(q)
      || w.affiliate?.email.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  function handleUpdate(id: string, status: 'approved' | 'rejected', remarks: string, screenshot?: string) {
    setWithdrawals(prev => prev.map(w =>
      w.id === id
        ? { ...w, status, remarks, paymentScreenshot: screenshot, processedAt: new Date().toISOString() }
        : w
    ))
  }

  const STAT_CARDS = [
    { label: 'Total Requests', value: stats.total, icon: Banknote, bg: '#eef2ff', color: '#2b4bb9' },
    { label: 'Pending',        value: stats.pending, icon: Clock,    bg: '#fff8e6', color: '#b45309' },
    { label: 'Approved',       value: stats.approved, icon: Check,   bg: '#f0fdf4', color: '#15803d' },
    { label: 'Rejected',       value: stats.rejected, icon: XCircle, bg: '#fef2f2', color: '#b91c1c' },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--surface-container-lowest)' }}>
      <Topbar title="Withdraw Requests" description="Review and process affiliate withdrawal requests" />
      <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-6 max-w-[1440px]">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
          <div>
            <nav className="flex items-center gap-1.5 text-xs mb-2" style={{ color: '#9ca3af' }}>
              <span>Dashboard</span>
              <span>›</span>
              <span style={{ color: '#2b4bb9', fontWeight: 600 }}>Withdraw Requests</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              Withdraw Requests
            </h1>
            <p className="text-sm mt-1 hidden sm:block" style={{ color: '#6b7280' }}>
              Review and process affiliate withdrawal requests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWithdrawals(INITIAL)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#f4f5ff', color: '#2b4bb9', border: '1px solid #d0d9ff' }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {STAT_CARDS.map(card => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="rounded-2xl p-5"
                style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', border: '1px solid #f1f5f9' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>{card.label}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                    <Icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                </div>
                <p className="text-3xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
                  {card.value}
                </p>
                {card.label === 'Pending' && (
                  <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                    ${stats.totalAmount.toFixed(2)} outstanding
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Table card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', border: '1px solid #f1f5f9' }}>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4 md:p-5" style={{ borderBottom: '1px solid #f4f5ff' }}>
            {/* Search */}
            <div
              className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
              style={{ minWidth: '200px', background: '#f8faff', border: '1px solid #f1f5f9' }}
            >
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#9ca3af' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by ID, name or email..."
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: '#0f172a' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ color: '#9ca3af' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="appearance-none pl-4 pr-9 py-2.5 rounded-xl text-sm font-medium outline-none"
                style={{ background: '#f8faff', color: '#374151', border: '1px solid #f1f5f9' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#fafbff', borderBottom: '1px solid #f4f5ff' }}>
                  {['Request ID', 'Affiliate', 'Bank', 'Amount', 'Requested', 'Status', 'Actions'].map(h => (
                    <th key={h} className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f4f5ff' }}>
                          <Banknote className="w-6 h-6" style={{ color: '#9ca3af' }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>No withdrawal requests found</p>
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
                    {/* Request ID */}
                    <td className="py-5 px-6">
                      <span className="text-sm font-bold font-mono" style={{ color: '#2b4bb9' }}>#{w.id}</span>
                    </td>

                    {/* Affiliate */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: '#eef2ff', color: '#2b4bb9' }}
                        >
                          {w.affiliate?.fullName.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{w.affiliate?.fullName ?? 'Unknown'}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{w.affiliate?.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Bank */}
                    <td className="py-5 px-6">
                      <p className="text-sm" style={{ color: '#374151' }}>{w.affiliate?.bankName ?? '—'}</p>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: '#9ca3af' }}>{w.affiliate?.accountNumber ?? '—'}</p>
                    </td>

                    {/* Amount */}
                    <td className="py-5 px-6">
                      <span className="text-base font-bold tabular-nums" style={{ color: '#0f172a' }}>
                        ${w.amount.toFixed(2)}
                      </span>
                    </td>

                    {/* Requested */}
                    <td className="py-5 px-6">
                      <span className="text-sm" style={{ color: '#6b7280' }}>
                        {new Date(w.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-5 px-6">
                      <StatusPill status={w.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-5 px-6">
                      {w.status === 'pending' ? (
                        <button
                          onClick={() => setSelected(w)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#eef2ff]"
                          style={{ color: '#2b4bb9' }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelected(w)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#f4f5ff]"
                          style={{ color: '#6b7280' }}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #f4f5ff' }}>
            <p className="text-xs" style={{ color: '#9ca3af' }}>
              Showing {filtered.length} of {withdrawals.length} requests
            </p>
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: '#fff8e6', color: '#b45309' }}
            >
              {stats.pending} pending review
            </span>
          </div>
        </div>
      </div>

      {/* Review modal */}
      {selected && (
        <ReviewModal
          item={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
