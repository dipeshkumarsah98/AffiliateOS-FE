'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Topbar } from '@/components/layout/Topbar'
import { DUMMY_AFFILIATES } from '@/lib/dummy-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table'
import { Search, PackagePlus, Package, XCircle, ArrowDown, RefreshCw, Eye } from 'lucide-react'
import { useOrdersQuery, useOrderStatsQuery } from '@/hooks/use-orders'
import type { OrderListItem } from '@/lib/api/orders'
import { DateFilter, DateFilterValue } from '@/components/dashboard/orders/DateFilter'
import { TruncatedText } from '@/components/dashboard/orders/TruncatedText'
import { StatCard } from '@/components/dashboard/orders/StatCard'
import { StatusSelect } from '@/components/dashboard/orders/StatusSelect'
import { StatusPill } from '@/components/dashboard/orders/StatusPill'
import { AffiliateAvatar } from '@/components/dashboard/orders/AffiliateAvatar'
import { OrdersPagination } from '@/components/dashboard/orders/OrdersPagination'
import { OrderDetailModal } from '@/components/dashboard/orders/OrderDetailModal'
import { format } from 'date-fns'
import { useDebounce } from '@/hooks/use-debounce'
import { formatRelative } from '@/lib/stock-utils'
import { cn, formatCurrency } from '@/lib/utils'


const PAGE_SIZE = 5

function getDefaultDateFilter(): DateFilterValue {
  return {
    type: 'all_time',
    range: {
      from: undefined,
      to: undefined
    }
  }
}

export default function OrdersPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>((searchParams.get('sort') as 'asc' | 'desc') || 'desc')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null)

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
    if (sortDir !== 'desc') params.set('sort', sortDir)
    if (page !== 1) params.set('page', String(page))
    if (dateFilter.range.from) params.set('fromDate', format(dateFilter.range.from, 'yyyy-MM-dd'))
    if (dateFilter.range.to) params.set('toDate', format(dateFilter.range.to, 'yyyy-MM-dd'))
    if (dateFilter.type && dateFilter.type !== 'all_time') params.set('dateType', dateFilter.type)

    const newUrl = params.toString() ? `/dashboard/orders?${params.toString()}` : '/dashboard/orders'
    router.replace(newUrl, { scroll: false })
  }, [search, statusFilter, sortDir, page, dateFilter, router])

  const ordersQuery = useOrdersQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    fromDate: dateFilter.range.from ? format(dateFilter.range.from, 'yyyy-MM-dd') : undefined,
    toDate: dateFilter.range.to ? format(dateFilter.range.to, 'yyyy-MM-dd') : undefined,
  })

  const statsQuery = useOrderStatsQuery()

  const isFiltering = search !== debouncedSearch

  // Stats Data
  const totalOrders = statsQuery.data?.totalOrders ?? 0
  const processing = statsQuery.data?.processingOrders ?? 0
  const grossRevenue = statsQuery.data?.grossRevenue ?? 0
  const cancelled = statsQuery.data?.cancellations ?? 0
  const cancellationRate = totalOrders > 0 ? ((cancelled / totalOrders) * 100).toFixed(1) : "0.0"

  const orders = ordersQuery.data?.items ?? []
  const totalItems = ordersQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  // Ensure safePage is synced to local state if boundaries shift
  useEffect(() => {
    if (safePage !== page) {
      setPage(safePage)
    }
  }, [page, safePage])

  function handlePage(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)))
  }

  function handleDateFilterChange(newDateFilter: DateFilterValue) {
    setDateFilter(newDateFilter)
    setPage(1) // Reset to first page when filter changes
  }

  function handleStatusChange(status: string) {
    setStatusFilter(status)
    setPage(1)
  }

  function handleSearchChange(searchValue: string) {
    setSearch(searchValue)
    setPage(1)
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Topbar title="Orders" description="Track and manage all orders" />

      <div className="flex-1 p-4 md:p-8 max-w-screen-2xl mx-auto w-full">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between mb-6 md:mb-8">
          <div></div>
          {currentUser?.roles.includes('admin') && (
            <Button
              className="mt-2 sm:mt-0"
              onClick={() => router.push('/dashboard/orders/new')}
            >
              <PackagePlus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          )}
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6">
          <StatCard
            label="Total Orders"
            value={totalOrders.toLocaleString()}
            accent
          />
          <StatCard
            label="Processing"
            value={String(processing)}
            icon={
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
            }
          />
          <StatCard
            label="Gross Revenue"
            value={`$${(grossRevenue / 1000).toFixed(1)}k`}
            icon={
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10">
                <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
            }
          />
          <StatCard
            label="Cancellations"
            value={`${cancellationRate}%`}
            icon={
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-destructive/10">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
            }
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 border bg-card text-card-foreground shadow-sm">
          <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search ID or Customer..."
            className="flex-1 text-sm bg-transparent border-0 shadow-none px-0 focus-visible:ring-0"
          />
          {ordersQuery.isFetching ? (
            <div className="flex items-center gap-2 text-xs shrink-0 text-muted-foreground">
              <RefreshCw className={cn('w-3.5 h-3.5', isFiltering && 'animate-spin')} />
              {isFiltering ? 'Searching...' : 'Syncing...'}
            </div>
          ) : null}
          <StatusSelect
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-40"
          />
          <DateFilter
            value={dateFilter}
            onChange={handleDateFilterChange}
            className="min-w-45"
          />
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Order ID</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                  >
                    Date
                    <ArrowDown
                      className={cn('w-3 h-3 transition-transform', sortDir === 'asc' && 'rotate-180')}
                      style={{ color: '#2b4bb9' }}
                    />
                  </button>
                </TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Name</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer Name</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Affiliate</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const isDirect = !order.affiliateId;

                return (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid #f4f5ff' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbff')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell className="py-4 px-6">
                      <TruncatedText
                        text={order.orderNumber}
                        maxLength={12}
                        className="text-xs font-mono font-bold"
                        style={{ color: '#2b4bb9' }}
                      />
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-sm font-medium" style={{ color: '#0f1623' }}>{formatRelative(order.createdAt)}</span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                          style={{ background: '#eef2ff' }}
                        >
                          <Package className="w-4 h-4" style={{ color: '#2b4bb9' }} />
                        </div>
                        <div>
                          <TruncatedText
                            text={order.items[0]?.product?.title || 'Unknown Product'}
                            maxLength={25}
                            className="text-sm font-semibold leading-snug"
                            style={{ color: '#0f1623' }}
                          />
                          {order.items.length > 1 && (
                            <p className="text-xs mt-0.5 font-mono" style={{ color: '#9ca3af' }}>
                              +{order.items.length - 1} more items
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <TruncatedText
                        text={order.user.name}
                        maxLength={20}
                        className="text-sm font-medium"
                        style={{ color: '#0f1623' }}
                      />
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {isDirect ? (
                        <span className="text-sm italic" style={{ color: '#9ca3af' }}>Direct Traffic</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <Package className="w-3 h-3" />
                          Affiliated
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-sm font-bold tabular-nums" style={{ color: '#2b4bb9' }}>
                        {formatCurrency(order.totalAmount, order.currency)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <StatusPill status={order.status} />
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/orders/${order.id}`)
                        }}
                        className="h-auto px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#eef2ff]"
                        style={{ color: '#2b4bb9' }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}

              {ordersQuery.isLoading && (
                <TableRow>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableCell key={i} className="py-4 px-6">
                      <div
                        className="h-3 rounded-full animate-pulse bg-muted"
                        style={{
                          width: ['80px', '60px', '140px', '100px', '120px', '60px', '80px', '60px'][i],
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </TableBody>
          </Table>

          {!ordersQuery.isLoading && orders.length === 0 && (
            <div className="text-center py-20">
              <p className="text-sm font-medium text-muted-foreground">No orders match your filters.</p>
            </div>
          )}

          <OrdersPagination
            page={safePage}
            totalPages={totalPages}
            total={totalItems}
            pageSize={PAGE_SIZE}
            onChange={handlePage}
          />
        </div>
      </div>

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  )
}
