'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useAuthStore } from '@/stores/auth-store'
import { useCommissionsQuery, useCommissionSummaryQuery } from '@/hooks/use-commissions'
import type { CommissionItem, CommissionSortBy, SortOrder } from '@/lib/api/commissions'

import { Topbar } from '@/components/layout/Topbar'
import StatCardSkeleton from '@/components/common/StatCardSkeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import {
  DollarSign,
  LinkIcon,
  ShoppingCart,
  CheckCircle,
  X,
  Eye,
  Package,
  TrendingUp,
  Calendar,
  Percent,
  Banknote,
  BadgeCheck,
  BadgeX,
  ArrowUpDown,
  ArrowUpZa,
  ArrowDownAz,
} from 'lucide-react'
import { formatRelative } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

const PAGE_SIZE = 20

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: '#f0fdf4', color: '#15803d' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: '#f7f7f8', color: '#6b7280' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
      Inactive
    </span>
  )
}

function CommissionDetailModal({ item, onClose }: { item: CommissionItem; onClose: () => void }) {
  const productImage = item.product.images[0] || '/placeholder-product.png'

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[calc(100%-2rem)] sm:w-full max-w-lg rounded-2xl p-0! gap-0 overflow-y-auto max-h-[90vh] outline-none border-none mx-auto scrollbar-hide"
        style={{ background: '#fff', boxShadow: '0 32px 80px rgba(19,27,46,0.18)' }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Commission Detail</DialogTitle>

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-start justify-between bg-[#f8faff] sticky top-0 z-10" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-base sm:text-lg font-bold truncate" style={{ color: '#0f172a', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              {item.product.title}
            </h2>
            <p className="text-xs sm:text-sm mt-0.5 font-mono" style={{ color: '#9ca3af' }}>Code: {item.code}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f1f5f9] shrink-0" style={{ color: '#6b7280' }}>
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Product card */}
          <div className="rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4" style={{ background: '#f8faff', border: '1px solid #e2e8f0' }}>
            <img
              src={productImage}
              alt={item.product.title}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shrink-0"
              style={{ border: '1px solid #e2e8f0' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-semibold truncate flex-1" style={{ color: '#0f172a', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.product.title}</p>
              <p className="text-xs sm:text-sm mt-1" style={{ color: '#9ca3af' }}>Base Price: {formatCurrency(item.product.price, 'NPR')}</p>
            </div>
          </div>

          {/* Commission & Discount Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl p-3 sm:p-4" style={{ background: '#f0fdf4' }}>
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#16a34a' }} />
                <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold" style={{ color: '#9ca3af' }}>Commission</p>
              </div>
              <p className="text-sm sm:text-base font-bold" style={{ color: '#0f172a' }}>
                {item.commissionType === 'PERCENTAGE' ? `${item.commissionValue}%` : `NPR ${item.commissionValue}`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                {item.commissionType === 'PERCENTAGE' ? 'Per order' : 'Flat fee'}
              </p>
            </div>
            <div className="rounded-xl p-3 sm:p-4" style={{ background: '#eef2ff' }}>
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#2b4bb9' }} />
                <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold" style={{ color: '#9ca3af' }}>Discount</p>
              </div>
              <p className="text-sm sm:text-base font-bold" style={{ color: '#0f172a' }}>
                {item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : `NPR ${item.discountValue}`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                Customer discount
              </p>
            </div>
          </div>

          {/* Performance stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 sm:p-4" style={{ background: '#f8faff' }}>
              <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1.5 sm:mb-2" style={{ color: '#9ca3af' }}>Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#0f172a', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
                {item.totalOrders}
              </p>
            </div>
            <div className="rounded-xl p-3 sm:p-4" style={{ background: '#f8faff' }}>
              <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1.5 sm:mb-2" style={{ color: '#9ca3af' }}>Completed</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#0f172a', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
                {item.completedOrders}
              </p>
            </div>
            <div className="rounded-xl p-4 sm:p-5 col-span-2 flex flex-col items-center justify-center text-center text-white" style={{ background: 'linear-gradient(135deg, #10b981 0%, #15803d 100%)', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)' }}>
              <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 sm:mb-1.5 opacity-90">Total Earned</p>
              <p className="text-xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
                NPR {item.totalCommission.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Last completed order & Status */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 rounded-xl p-3 sm:p-4 flex flex-col justify-center" style={{ background: '#f8faff' }}>
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <Calendar className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
                <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold" style={{ color: '#9ca3af' }}>Last Order</p>
              </div>
              <p className="text-sm sm:text-base font-semibold" style={{ color: '#0f172a' }}>
                {item.lastCompletedOrderDate
                  ? formatRelative(new Date(item.lastCompletedOrderDate), new Date())
                  : '—'}
              </p>
            </div>

            <div className="flex-1 rounded-xl p-3 sm:p-4 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-2" style={{ background: '#f8faff' }}>
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1.5" style={{ color: '#9ca3af' }}>Status</p>
                <StatusBadge isActive={item.isActive} />
              </div>
              <div className="text-right sm:text-left">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1.5" style={{ color: '#9ca3af' }}>Created</p>
                <p className="text-xs sm:text-sm font-semibold" style={{ color: '#0f172a' }}>
                  {formatRelative(new Date(item.createdAt), new Date())}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 sticky bottom-0 bg-white" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full py-5 sm:py-6 rounded-xl text-sm font-semibold hover:bg-[#f1f5f9] transition-colors"
            style={{ background: '#f8faff', color: '#6b7280' }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Pagination ──────────────────────────────────────────────────────────────
function CommissionsPagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}) {
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderTop: '1px solid #f4f5ff' }}>
      <p className="text-xs" style={{ color: '#9ca3af' }}>
        Showing {startItem}–{endItem} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="h-9 px-3 rounded-lg text-sm font-semibold disabled:opacity-40"
          style={{ color: '#6b7280' }}
        >
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (page <= 3) {
              pageNum = i + 1
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = page - 2 + i
            }
            return (
              <Button
                key={pageNum}
                variant="ghost"
                onClick={() => onChange(pageNum)}
                className="h-9 w-9 rounded-lg text-sm font-semibold"
                style={
                  page === pageNum
                    ? { background: '#eef2ff', color: '#2b4bb9' }
                    : { color: '#6b7280' }
                }
              >
                {pageNum}
              </Button>
            )
          })}
        </div>
        <Button
          variant="ghost"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="h-9 px-3 rounded-lg text-sm font-semibold disabled:opacity-40"
          style={{ color: '#6b7280' }}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default function EarningsPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (currentUser && !currentUser.roles.includes('vendor')) {
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [detailItem, setDetailItem] = useState<CommissionItem | null>(null)
  const [sortBy, setSortBy] = useState<CommissionSortBy>(
    (searchParams.get('sortBy') as CommissionSortBy) || 'totalCommission'
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sortOrder') as SortOrder) || 'desc'
  )
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>(
    (searchParams.get('active') as 'all' | 'active' | 'inactive') || 'all'
  )

  useEffect(() => {
    const params = new URLSearchParams()
    if (sortBy !== 'totalCommission') params.set('sortBy', sortBy)
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder)
    if (activeFilter !== 'all') params.set('active', activeFilter)
    if (page !== 1) params.set('page', String(page))
    const newUrl = params.toString() ? `/dashboard/earnings?${params.toString()}` : '/dashboard/earnings'
    router.replace(newUrl, { scroll: false })
  }, [sortBy, sortOrder, activeFilter, page, router])

  const { data: summaryData, isLoading: summaryLoading } = useCommissionSummaryQuery()

  const { data: commissionsData, isLoading: listLoading } = useCommissionsQuery({
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
    ...(activeFilter !== 'all' ? { isActive: activeFilter === 'active' } : {}),
  })

  const items = commissionsData?.items ?? []
  const total = commissionsData?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const STATS = [
    {
      label: 'Total Commission',
      value: summaryData ? formatCurrency(summaryData.totalCommission, 'NPR') : '—',
      icon: DollarSign,
      bg: '#eef2ff',
      color: '#2b4bb9',
    },
    {
      label: 'Active Links',
      value: summaryData ? summaryData.activeLinks : '—',
      icon: LinkIcon,
      bg: '#f0fdf4',
      color: '#16a34a',
    },
    {
      label: 'Total Orders',
      value: summaryData ? summaryData.totalOrders : '—',
      icon: ShoppingCart,
      bg: '#fffbeb',
      color: '#b45309',
    },
    {
      label: 'Completed Orders',
      value: summaryData ? summaryData.completedOrders : '—',
      icon: CheckCircle,
      bg: '#f0fdf4',
      color: '#16a34a',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--surface-container-lowest)' }}>
      <Topbar title="Earnings" description="Track your affiliate commission and performance" />

      <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-6 max-w-screen-2xl mx-auto w-full">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          ) : (
            STATS.map(s => {
              const Icon = s.icon
              return (
                <Card
                  key={s.label}
                  className="rounded-2xl p-3.5 sm:p-5 flex flex-row items-center gap-3 sm:gap-4"
                  style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', border: '1px solid #f1f5f9' }}
                >
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs font-medium whitespace-normal sm:whitespace-nowrap sm:truncate leading-tight" style={{ color: '#9ca3af' }}>{s.label}</p>
                    <p className="text-base sm:text-xl font-bold mt-0.5 sm:mt-0.5 truncate" style={{ color: '#0f172a', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                      {s.value}
                    </p>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        {/* Toolbar + Table */}
        <Card
          className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', border: '1px solid #f1f5f9' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5" style={{ borderBottom: '1px solid #f8faff', background: '#fff' }}>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>Commission Performance</h2>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#6b7280' }}>
                {total} affiliate link{total !== 1 ? 's' : ''} active
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3">
              {/* Segmented Status Filter */}
              <div
                className="flex items-center p-1 rounded-xl w-full sm:w-auto"
                style={{ background: '#f8faff', border: '1px solid #f1f5f9' }}
              >
                {(['all', 'active', 'inactive'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => { setActiveFilter(status); setPage(1); }}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${activeFilter === status
                      ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[#0f172a]'
                      : 'text-[#9ca3af] hover:text-[#6b7280]'
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="hidden sm:block h-6 w-px" style={{ background: '#e2e8f0' }} />

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Sort Dropdown */}
                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    setSortBy(val as CommissionSortBy)
                    setPage(1)
                  }}
                >
                  <SelectTrigger
                    className="flex-1 sm:flex-none sm:w-[150px] h-9 rounded-xl text-sm font-medium bg-white outline-none focus:ring-0 focus:ring-offset-0"
                    style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" style={{ color: '#6b7280' }} />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#f1f5f9] shadow-lg">
                    <SelectItem value="totalCommission" className="font-medium">Total Earned</SelectItem>
                    <SelectItem value="orderCount" className="font-medium">Orders</SelectItem>
                    <SelectItem value="lastOrderDate" className="font-medium">Last Completed</SelectItem>
                    <SelectItem value="code" className="font-medium">Code</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Order Action */}
                <Button
                  variant="ghost"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-9 w-9 p-0 rounded-xl bg-white hover:bg-[#f8faff] shrink-0"
                  style={{ border: '1px solid #e2e8f0' }}
                  title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUpZa className="w-4 h-4" style={{ color: '#6b7280' }} />
                  ) : (
                    <ArrowDownAz className="w-4 h-4" style={{ color: '#6b7280' }} />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow style={{ background: '#fafbff', borderBottom: '1px solid #f4f5ff' }} className="hover:bg-transparent">
                  {['Product', 'Affiliate Code', 'Orders', 'Total Earned', 'Last Completed', 'Status', ''].map(h => (
                    <TableHead key={h} className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {listLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent" style={{ borderBottom: '1px solid #f4f5ff' }}>
                      <TableCell className="py-5 px-6" colSpan={7}>
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-12 h-12 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f4f5ff' }}>
                          <Package className="w-5 h-5" style={{ color: '#9ca3af' }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                          No commissions yet
                        </p>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>
                          Start sharing your affiliate links to earn commission
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.map(item => {
                  const productImage = item.product.images[0] || '/placeholder-product.png'
                  return (
                    <TableRow
                      key={item.affiliateLinkId}
                      style={{ borderBottom: '1px solid #f4f5ff' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      className="cursor-pointer"
                      onClick={() => setDetailItem(item)}
                    >
                      {/* Product */}
                      <TableCell className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={productImage}
                            alt={item.product.title}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                            style={{ border: '1px solid #e2e8f0' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>
                              {item.product.title}
                            </p>
                            <p className="text-xs truncate" style={{ color: '#9ca3af' }}>
                              NPR {item.product.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Affiliate Code */}
                      <TableCell className="py-5 px-6">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg" style={{ background: '#eef2ff', color: '#2b4bb9' }}>
                          {item.code}
                        </span>
                      </TableCell>

                      {/* Orders */}
                      <TableCell className="py-5 px-6">
                        <span className="text-sm font-semibold tabular-nums" style={{ color: '#0f172a' }}>
                          {item.completedOrders}/{item.totalOrders}
                        </span>
                      </TableCell>

                      {/* Total Earned */}
                      <TableCell className="py-5 px-6">
                        <span className="text-sm font-bold tabular-nums" style={{ color: '#16a34a' }}>
                          {formatCurrency(item.totalCommission, 'NPR')}
                        </span>
                      </TableCell>

                      {/* Last Completed */}
                      <TableCell className="py-5 px-6">
                        <span className="text-sm" style={{ color: '#6b7280' }}>
                          {item.lastCompletedOrderDate
                            ? formatRelative(new Date(item.lastCompletedOrderDate), new Date())
                            : '—'}
                        </span>
                      </TableCell>

                      <TableCell className="py-5 px-6">
                        <StatusBadge isActive={item.isActive} />
                      </TableCell>

                      <TableCell className="py-5 px-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDetailItem(item)
                          }}
                          className="w-8 h-8 rounded-lg hover:bg-[#f1f5f9]"
                          style={{ color: '#6b7280' }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <CommissionsPagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          )}
        </Card>
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <CommissionDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      )}
    </div>
  )
}
