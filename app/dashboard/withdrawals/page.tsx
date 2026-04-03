'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Banknote, Search, ChevronDown, Eye, Check, X, XCircle, ImageIcon, RefreshCw, Clock } from 'lucide-react'
import { DUMMY_WITHDRAWALS, DUMMY_AFFILIATES } from '@/lib/dummy-data'
import type { Withdrawal, Affiliate } from '@/lib/types'
import { Topbar } from '@/components/layout/Topbar'
import { ReviewModal } from '@/components/dashboard/withdrawals/ReviewModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { formatRelative } from 'date-fns'

type WithdrawalWithAffiliate = Withdrawal & { affiliate: Affiliate | undefined }

const INITIAL: WithdrawalWithAffiliate[] = DUMMY_WITHDRAWALS.map((w) => ({
  ...w,
  affiliate: DUMMY_AFFILIATES.find((a) => a.id === w.affiliateId),
}))

function StatusPill({ status }: { status: Withdrawal['status'] }) {
  const map = {
    pending: { bg: '#fff8e6', color: '#b45309', dot: '#f59e0b', label: 'Pending' },
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

export default function WithdrawalsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize state from URL params
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithAffiliate[]>(INITIAL)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState<Withdrawal['status'] | 'all'>(
    (searchParams.get('status') as Withdrawal['status']) || 'all'
  )
  const [selected, setSelected] = useState<WithdrawalWithAffiliate | null>(null)

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    if (search.trim()) params.set('search', search.trim())
    if (statusFilter !== 'all') params.set('status', statusFilter)

    const newUrl = params.toString()
      ? `/dashboard/withdrawals?${params.toString()}`
      : '/dashboard/withdrawals'
    router.replace(newUrl, { scroll: false })
  }, [search, statusFilter, router])

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter((w) => w.status === 'pending').length,
    approved: withdrawals.filter((w) => w.status === 'approved').length,
    rejected: withdrawals.filter((w) => w.status === 'rejected').length,
    totalAmount: withdrawals
      .filter((w) => w.status === 'pending')
      .reduce((s, w) => s + w.amount, 0),
  }

  const filtered = withdrawals.filter((w) => {
    const matchStatus = statusFilter === 'all' || w.status === statusFilter
    const q = debouncedSearch.toLowerCase()
    const matchSearch =
      !q ||
      w.id.toLowerCase().includes(q) ||
      w.affiliate?.fullName.toLowerCase().includes(q) ||
      w.affiliate?.email.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const isFiltering = search !== debouncedSearch

  function handleUpdate(
    id: string,
    status: 'approved' | 'rejected',
    remarks: string,
    screenshot?: string
  ) {
    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
            ...w,
            status,
            remarks,
            paymentScreenshot: screenshot,
            processedAt: new Date().toISOString(),
          }
          : w
      )
    )
  }

  function handleSearch(val: string) {
    setSearch(val)
  }

  function handleStatusFilter(status: string) {
    setStatusFilter(status as typeof statusFilter)
  }

  const STAT_CARDS = [
    {
      label: 'Total Requests',
      value: stats.total,
      icon: (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
          <Banknote className="w-5 h-5 text-primary" />
        </div>
      ),
    },
    {
      label: 'Pending',
      value: stats.pending,
      sub: `$${stats.totalAmount.toFixed(2)} outstanding`,
      icon: (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/10">
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
      ),
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10">
          <Check className="w-5 h-5 text-emerald-600" />
        </div>
      ),
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-destructive/10">
          <XCircle className="w-5 h-5 text-destructive" />
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Topbar
        title="Withdraw Requests"
        description="Review and process affiliate withdrawal requests"
      />
      <div className="flex-1 p-4 md:p-8 max-w-screen-2xl mx-auto w-full">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6">
          {STAT_CARDS.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 px-6 py-5">
                {stat.icon}
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5 text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  {stat.sub && (
                    <p className="text-xs mt-1 font-medium text-muted-foreground">{stat.sub}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 border bg-card text-card-foreground shadow-sm">
          <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by ID, name or email..."
            className="flex-1 text-sm bg-transparent border-0 shadow-none px-0 focus-visible:ring-0"
          />
          {isFiltering ? (
            <div className="flex items-center gap-2 text-xs shrink-0 text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Searching...
            </div>
          ) : null}

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2 rounded-xl text-sm font-medium outline-none transition-all border bg-background"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {[
                  'Request ID',
                  'Affiliate',
                  'Bank',
                  'Amount',
                  'Requested',
                  'Status',
                  'Actions',
                ].map((h) => (
                  <TableHead
                    key={h}
                    className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-muted">
                        <Banknote className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {debouncedSearch
                          ? 'No withdrawal requests match your search'
                          : 'No withdrawal requests found'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((w) => (
                  <TableRow
                    key={w.id}
                    className="cursor-pointer transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbff')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Request ID */}
                    <TableCell className="py-5 px-6">
                      <span className="text-sm font-bold font-mono" style={{ color: '#2b4bb9' }}>
                        #{w.id}
                      </span>
                    </TableCell>

                    {/* Affiliate */}
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: '#eef2ff', color: '#2b4bb9' }}
                        >
                          {w.affiliate?.fullName.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                            {w.affiliate?.fullName ?? 'Unknown'}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                            {w.affiliate?.email ?? '—'}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-5 px-6">
                      <p className="text-sm" style={{ color: '#374151' }}>
                        {w.affiliate?.bankName ?? '—'}
                      </p>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: '#9ca3af' }}>
                        {w.affiliate?.accountNumber ?? '—'}
                      </p>
                    </TableCell>

                    <TableCell className="py-5 px-6">
                      <span
                        className="text-base font-bold tabular-nums"
                        style={{ color: '#0f172a' }}
                      >
                        NPR {w.amount.toFixed(2)}
                      </span>
                    </TableCell>

                    <TableCell className="py-5 px-6">
                      <span className="text-sm" style={{ color: '#6b7280' }}>
                        {formatRelative(new Date(w.requestedAt), new Date())}
                      </span>
                    </TableCell>

                    <TableCell className="py-5 px-6">
                      <StatusPill status={w.status} />
                    </TableCell>

                    <TableCell className="py-5 px-6">
                      {w.status === 'pending' ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelected(w)}
                          className="h-auto px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#eef2ff]"
                          style={{ color: '#2b4bb9' }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Review
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelected(w)}
                          className="h-auto px-3 py-1.5 rounded-lg text-xs font-semibold"
                        >
                          <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-6 py-4 border-t"
          >
            <p className="text-sm text-muted-foreground">
              Showing <strong className="text-foreground">{filtered.length}</strong> of{' '}
              <strong className="text-foreground">{withdrawals.length}</strong> requests
            </p>
            {stats.pending > 0 && (
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: '#fff8e6', color: '#b45309' }}
              >
                {stats.pending} pending review
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Review modal */}
      {selected && (
        <ReviewModal item={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />
      )}
    </div>
  )
}
