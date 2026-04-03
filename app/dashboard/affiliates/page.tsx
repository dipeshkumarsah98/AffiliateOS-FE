'use client'

import { useState, useDeferredValue, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Topbar } from '@/components/layout/Topbar'
import { DUMMY_PRODUCTS } from '@/lib/dummy-data'
import { useAffiliatesQuery } from '@/hooks/use-affiliates'
import type { AffiliateListItem, AffiliateTypeAPI } from '@/lib/api/affiliates'
import type { Affiliate, AffiliateType } from '@/lib/types'
import {
  Plus, X, RefreshCw, Search, User, ShieldOff,
  ChevronRight, ChevronDown, Mail, Phone, Building2, Check,
  Edit2, Trash2, Eye, Users, Package,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AffiliatesTableBody } from '@/components/dashboard/affiliates/AffiliatesTableBody'
import { ProductsPagination } from '@/components/dashboard/products/ProductsPagination'

// ---- Helpers ----
function generateCode(name: string) {
  const base = name.toUpperCase().replace(/\s+/g, '').slice(0, 6)
  const num = Math.floor(Math.random() * 90 + 10)
  return `${base}${num}`
}

const AFFILIATE_TYPE_LABELS: Record<AffiliateType, string> = {
  influencer: 'Influencer',
  reseller: 'Reseller',
  referral: 'Referral',
  partner: 'Partner',
}

const AFFILIATE_TYPE_COLORS: Record<AffiliateType, { bg: string; fg: string }> = {
  influencer: { bg: '#ede9fe', fg: '#5b21b6' },
  reseller: { bg: '#dbeafe', fg: '#1d4ed8' },
  referral: { bg: '#d1fae5', fg: '#065f46' },
  partner: { bg: '#fef3c7', fg: '#92400e' },
}

function ViewAffiliateModal({
  affiliate,
  onEdit,
  onClose
}: {
  affiliate: AffiliateListItem;
  onEdit: () => void;
  onClose: () => void
}) {
  const vendorName = affiliate.vendor.name;
  const vendorEmail = affiliate.vendor.email
  const affiliateType = affiliate.vendor.extras.affiliateType
  const bankName = affiliate.vendor.extras.bankName || 'N/A'
  const accountNumber = affiliate.vendor.extras.accountNumber || 'N/A'

  const typeLower = affiliateType.toLowerCase() as AffiliateType
  const typeColors = AFFILIATE_TYPE_COLORS[typeLower]
  const isActive = affiliate.isActive

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(19,27,46,0.45)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden animate-fade-in-up flex flex-col sm:flex-row"
        style={{ background: '#fff', boxShadow: '0 32px 80px rgba(19,27,46,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── LEFT PANEL: Profile & Details ── */}
        <div className="flex-1 p-5 sm:p-8 flex flex-col gap-6">
          {/* Status + name */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                style={isActive ? { background: '#f0fdf4', color: '#15803d' } : { background: '#f4f5ff', color: '#6b7280' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? '#22c55e' : '#9ca3af' }} />
                {isActive ? 'Active' : 'Inactive'}
              </span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: typeColors.bg, color: typeColors.fg }}
              >
                {AFFILIATE_TYPE_LABELS[typeLower]}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: '#eef2ff', color: '#2b4bb9' }}
              >
                {vendorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
                  {vendorName}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
                  Joined {new Date(affiliate.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Contact Information</p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#f8faff' }}>
                  <Mail className="w-3.5 h-3.5" style={{ color: '#6b7280' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>Email</p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: '#0f172a' }}>{vendorEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {affiliate.product && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Linked Product</p>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#f8faff' }}>
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#eef2ff' }}>
                  <Package className="w-4 h-4 m-auto mt-2" style={{ color: '#2b4bb9' }} />
                </div>
                <span className="text-sm flex-1 font-medium truncate" style={{ color: '#0f172a' }}>{affiliate.product.title}</span>
              </div>
            </div>
          )}
        </div>

        <div
          className="sm:w-64 flex-shrink-0 flex flex-col p-5 sm:p-7 gap-6"
          style={{ background: '#fafbff', borderTop: '1px solid #f1f5f9' }}
        >
          {/* Close */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Partner Summary</p>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#f1f5f9]"
              style={{ color: '#6b7280' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Affiliate code */}
          <div className="rounded-xl p-4" style={{ background: '#eef2ff' }}>
            <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: '#2b4bb9', opacity: 0.7 }}>Affiliate Code</p>
            <p className="text-lg font-bold font-mono" style={{ color: '#2b4bb9', letterSpacing: '0.04em' }}>
              {affiliate.code}
            </p>
          </div>

          {/* Discount tile */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>Discount</p>
            <p className="text-2xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
              {affiliate.discountType === 'PERCENTAGE' ? `${affiliate.discountValue}%` : `$${affiliate.discountValue}`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {affiliate.discountType === 'PERCENTAGE' ? 'Percentage off order' : 'Fixed amount off'}
            </p>
          </div>

          {/* Commission tile */}
          <div className="rounded-xl p-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#15803d', opacity: 0.7 }}>Commission</p>
            <p className="text-2xl font-bold" style={{ color: '#15803d', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
              {affiliate.commissionType === 'PERCENTAGE' ? `${affiliate.commissionValue}%` : `$${affiliate.commissionValue}`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#15803d', opacity: 0.7 }}>
              {affiliate.commissionType === 'PERCENTAGE' ? 'Per sale' : 'Fixed per sale'}
            </p>
          </div>

          {/* Bank info */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Bank Details</p>
            <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{bankName}</p>
            <p className="text-xs font-mono mt-1" style={{ color: '#6b7280' }}>{accountNumber}</p>
          </div>

          {/* Actions */}
          <div className="mt-auto space-y-2.5 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={onEdit}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
            >
              <Edit2 className="w-4 h-4" />
              Edit Affiliate
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f1f5f9]"
              style={{ background: '#f8faff', color: '#6b7280' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Main Page ----
const PAGE_SIZE = 10

export default function AffiliatesPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const router = useRouter()
  const [viewAffiliate, setViewAffiliate] = useState<AffiliateListItem | null>(null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  // Convert typeFilter to backend format (UPPERCASE or undefined)
  const affiliateTypeParam: AffiliateTypeAPI | undefined = typeFilter === 'all' ? undefined : (typeFilter.toUpperCase() as AffiliateTypeAPI)

  const affiliatesQuery = useAffiliatesQuery({
    page,
    limit: PAGE_SIZE,
    search: deferredSearch.trim() || undefined,
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
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar title="Affiliates" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShieldOff className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--on-surface-variant)' }} />
            <p style={{ color: 'var(--on-surface-variant)' }}>Access restricted to admins only.</p>
          </div>
        </div>
      </div>
    )
  }

  const isFiltering = search !== deferredSearch
  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1) // Reset to first page on search
  }

  const handleRefetch = () => {
    affiliatesQuery.refetch()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Affiliates" description="Onboard and manage your affiliate partners" />

      <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-6 max-w-[1440px]">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Total Affiliates', value: stats.totalAffiliates.toString(), color: 'var(--primary)' },
            { label: 'Active', value: stats.active.toString(), color: 'var(--tertiary)' },
            { label: 'Inactive', value: stats.inactive.toString(), color: 'var(--on-surface-variant)' },
            { label: 'Products Linked', value: stats.productsLinked.toString(), color: '#7c3aed' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: s.color, letterSpacing: '-0.03em' }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search — fills available space */}
          <div
            className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', border: '1px solid #f1f5f9' }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#9ca3af' }} />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by name, email or affiliate code..."
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: '#0f172a' }}
            />
            {search && (
              <button onClick={() => handleSearch('')} style={{ color: '#9ca3af' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isFiltering && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: '#9ca3af' }} />
            )}
          </div>

          {/* Type dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={e => {
                setTypeFilter(e.target.value)
                setPage(1) // Reset to first page on filter change
              }}
              className="appearance-none pl-4 pr-9 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
              style={{
                background: '#fff',
                color: '#374151',
                boxShadow: '0 1px 4px rgba(19,27,46,0.06)',
                border: '1px solid #f1f5f9',
              }}
            >
              <option value="all">All Types</option>
              <option value="influencer">Influencer</option>
              <option value="reseller">Reseller</option>
              <option value="referral">Referral</option>
              <option value="partner">Partner</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
          </div>

          <button
            onClick={() => router.push('/dashboard/affiliates/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
          >
            <Plus className="w-4 h-4" />
            Register Affiliate
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #f4f5ff', background: '#fafbff' }}>
                  {['Affiliate', 'Type', 'Code', 'Discount', 'Commission', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AffiliatesTableBody
                  isLoading={affiliatesQuery.isLoading}
                  isError={affiliatesQuery.isError}
                  error={affiliatesQuery.error}
                  affiliates={affiliates}
                  deferredSearch={deferredSearch}
                  pageSize={PAGE_SIZE}
                  onRetry={handleRefetch}
                  onView={setViewAffiliate}
                  onEdit={(affiliate) => router.push(`/dashboard/affiliates/${affiliate.id}`)}
                />
              </tbody>
            </table>
          </div>

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
          onEdit={() => { router.push(`/dashboard/affiliates/${viewAffiliate.id}/edit`); setViewAffiliate(null) }}
          onClose={() => setViewAffiliate(null)}
        />
      )}
    </div>
  )
}
