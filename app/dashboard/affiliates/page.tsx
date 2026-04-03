'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Topbar } from '@/components/layout/Topbar'
import { useAffiliatesQuery } from '@/hooks/use-affiliates'
import type { AffiliateListItem, AffiliateTypeAPI } from '@/lib/api/affiliates'
import { Plus, X, RefreshCw, Search, ShieldOff, ChevronDown, Package, XCircle, Users } from 'lucide-react'
import { AffiliatesTableBody } from '@/components/dashboard/affiliates/AffiliatesTableBody'
import { ViewAffiliateModal } from '@/components/dashboard/affiliates/ViewAffiliateModal'
import { ProductsPagination } from '@/components/dashboard/products/ProductsPagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

const UnAuthorizedPage = () => (
  <div className="flex flex-col min-h-screen">
    <Topbar title="Affiliates" />
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <ShieldOff
          className="w-12 h-12 mx-auto mb-3 opacity-20"
          style={{ color: 'var(--on-surface-variant)' }}
        />
        <p style={{ color: 'var(--on-surface-variant)' }}>
          Access restricted to admins only.
        </p>
      </div>
    </div>
  </div>
)

export default function AffiliatesPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(search, 500)
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get('type') || 'all')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [viewAffiliate, setViewAffiliate] = useState<AffiliateListItem | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()

    if (search.trim()) params.set('search', search.trim())
    if (typeFilter !== 'all') params.set('type', typeFilter)
    if (page !== 1) params.set('page', String(page))

    const newUrl = params.toString()
      ? `/dashboard/affiliates?${params.toString()}`
      : '/dashboard/affiliates'
    router.replace(newUrl, { scroll: false })
  }, [search, typeFilter, page, router])

  const affiliateTypeParam: AffiliateTypeAPI | undefined =
    typeFilter === 'all' ? undefined : (typeFilter.toUpperCase() as AffiliateTypeAPI)

  const affiliatesQuery = useAffiliatesQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    affiliateType: affiliateTypeParam,
  })

  const affiliates = affiliatesQuery.data?.items ?? []
  const totalAffiliates = affiliatesQuery.data?.total ?? 0
  const stats = affiliatesQuery.data?.stats ?? {
    totalAffiliates: 0,
    active: 0,
    inactive: 0,
    productsLinked: 0,
  }
  const totalPages = Math.max(1, Math.ceil(totalAffiliates / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  useEffect(() => {
    if (safePage !== page) {
      setPage(safePage)
    }
  }, [page, safePage])

  useEffect(() => {
    if (!currentUser?.roles.includes('admin')) {
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  if (!currentUser?.roles.includes('admin')) {
    return <UnAuthorizedPage />
  }

  const isFiltering = search !== debouncedSearch

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1) // Reset to first page on search
  }

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type)
    setPage(1) // Reset to first page on filter change
  }

  const handleRefetch = () => {
    affiliatesQuery.refetch()
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Topbar title="Affiliates" description="Onboard and manage your affiliate partners" />

      <div className="flex-1 p-4 md:p-8 max-w-screen-2xl mx-auto w-full">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6">
          {[
            {
              label: 'Total Affiliates',
              value: stats.totalAffiliates.toString(),
              icon: (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              ),
            },
            {
              label: 'Active',
              value: stats.active.toString(),
              icon: (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
              ),
            },
            {
              label: 'Inactive',
              value: stats.inactive.toString(),
              icon: (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
              ),
            },
            {
              label: 'Products Linked',
              value: stats.productsLinked.toString(),
              icon: (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-purple-500/10">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
              ),
            },
          ].map((stat) => (
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
            placeholder="Search by name, email or affiliate code..."
            className="flex-1 text-sm bg-transparent border-0 shadow-none px-0 focus-visible:ring-0"
          />
          {affiliatesQuery.isFetching ? (
            <div className="flex items-center gap-2 text-xs shrink-0 text-muted-foreground">
              <RefreshCw className={cn('w-3.5 h-3.5', isFiltering && 'animate-spin')} />
              {isFiltering ? 'Searching...' : 'Syncing...'}
            </div>
          ) : null}

          {/* Type dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2 rounded-xl text-sm font-medium outline-none transition-all border bg-background"
            >
              <option value="all">All Types</option>
              <option value="influencer">Influencer</option>
              <option value="reseller">Reseller</option>
              <option value="referral">Referral</option>
              <option value="partner">Partner</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>

          <Button onClick={() => router.push('/dashboard/affiliates/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Register Affiliate
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {[
                  'Affiliate',
                  'Type',
                  'Code',
                  'Discount',
                  'Commission',
                  'Status',
                  'Joined',
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
              <AffiliatesTableBody
                isLoading={affiliatesQuery.isLoading}
                isError={affiliatesQuery.isError}
                error={affiliatesQuery.error}
                affiliates={affiliates}
                deferredSearch={debouncedSearch}
                pageSize={PAGE_SIZE}
                onRetry={handleRefetch}
                onView={setViewAffiliate}
                onEdit={(affiliate) => router.push(`/dashboard/affiliates/${affiliate.id}`)}
              />
            </TableBody>
          </Table>

          <ProductsPagination
            page={page}
            totalPages={totalPages}
            total={totalAffiliates}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      </div>

      {viewAffiliate && (
        <ViewAffiliateModal
          affiliate={viewAffiliate}
          onEdit={() => {
            router.push(`/dashboard/affiliates/${viewAffiliate.id}/edit`)
            setViewAffiliate(null)
          }}
          onClose={() => setViewAffiliate(null)}
        />
      )}
    </div>
  )
}
