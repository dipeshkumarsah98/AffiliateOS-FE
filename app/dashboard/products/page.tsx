'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/store'
import { Topbar } from '@/components/layout/Topbar'
import { useProductsQuery } from '@/hooks/use-products'
import type { ProductListItem } from '@/lib/api/products'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  Search, Plus, X, Package, Eye, Pencil, PackagePlus,
  ChevronLeft, ChevronRight, AlertTriangle, RefreshCw,
} from 'lucide-react'

const PAGE_SIZE = 5
const PRODUCT_IMAGE_FALLBACK = 'https://placehold.co/400x400/eef2ff/2b4bb9?text=Product'

function stockHealth(stock: number): { label: string; color: string; bar: string; pct: number } {
  if (stock === 0) return { label: 'Out of Stock', color: '#dc2626', bar: '#dc2626', pct: 0 }
  if (stock <= 10) return { label: 'Critical', color: '#dc2626', bar: '#dc2626', pct: Math.min(100, (stock / 10) * 100) }
  if (stock <= 40) return { label: 'Low', color: '#f59e0b', bar: '#f59e0b', pct: Math.min(100, (stock / 100) * 100) }
  if (stock <= 150) return { label: 'Moderate', color: '#3b82f6', bar: '#3b82f6', pct: Math.min(100, (stock / 200) * 100) }
  if (stock === Infinity || stock > 5000) return { label: 'Managed', color: '#2b4bb9', bar: '#2b4bb9', pct: 100 }
  return { label: 'Healthy', color: '#16a34a', bar: '#16a34a', pct: Math.min(100, (stock / 400) * 100) }
}

function statusBadge(status: string): { bg: string; text: string; label: string } {
  const normalized = status.toLowerCase()

  if (normalized === 'active' || normalized === 'published') {
    return { bg: '#dcfce7', text: '#15803d', label: 'Active' }
  }

  if (normalized === 'draft') {
    return { bg: '#fef3c7', text: '#b45309', label: 'Draft' }
  }

  if (normalized === 'archived' || normalized === 'inactive') {
    return { bg: '#f3f4f6', text: '#4b5563', label: 'Archived' }
  }

  return {
    bg: '#eef2ff',
    text: '#2b4bb9',
    label: normalized.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
  }
}

function getProductImage(product: ProductListItem): string {
  return product.images[0] || PRODUCT_IMAGE_FALLBACK
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function getProductDisplayId(product: ProductListItem): string {
  return `#${product.id.slice(0, 8).toUpperCase()}`
}


function ProductDetailModal({ product, onClose, onAdjustStock }: {
  product: ProductListItem
  onClose: () => void
  onAdjustStock: () => void
}) {
  const { currentUser } = useApp()
  const isAdmin = currentUser?.roles.includes('admin')
  const health = stockHealth(product.totalStock)
  const badge = statusBadge(product.status)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(19,27,46,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ background: '#fff', boxShadow: '0 32px 80px rgba(19,27,46,0.18)' }}
      >
        <div className="flex">
          <div className="w-64 shrink-0 relative" style={{ background: '#111' }}>
            <img
              src={getProductImage(product)}
              alt={product.title}
              className="w-full h-full object-cover"
              style={{ minHeight: '400px' }}
            />
          </div>

          <div className="flex-1 p-7 flex flex-col">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
                  style={{ background: badge.bg, color: badge.text }}
                >
                  {badge.label}
                </span>
                <span className="text-xs" style={{ color: '#6b7280' }}>Slug: {product.slug}</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                style={{ color: '#6b7280' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2
              className="text-2xl font-bold mb-1 text-balance"
              style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.02em', lineHeight: 1.25 }}
            >
              {product.title}
            </h2>
            <p
              className="text-xl font-bold mb-4"
              style={{ color: '#2b4bb9', fontFamily: 'var(--font-display)' }}
            >
              ${product.price.toFixed(2)}
            </p>

            <p className="text-sm leading-relaxed mb-6" style={{ color: '#4b5563' }}>
              {product.description}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-xl p-4" style={{ background: '#f8faff' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6b7280' }}>Stock Level</p>
                <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.02em' }}>
                  {product.totalStock === 0 ? '0 Units' : `${product.totalStock} Units`}
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ background: '#f8faff' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6b7280' }}>Last Updated</p>
                <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#16a34a', letterSpacing: '-0.02em' }}>
                  {formatDate(product.updatedAt)}
                </p>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-6" style={{ background: '#f8faff' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6b7280' }}>Record ID</p>
              <p className="text-sm font-mono" style={{ color: '#0f1623' }}>{product.id}</p>
            </div>

            {isAdmin && (
              <div className="flex gap-3 mt-auto">
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
                >
                  <Pencil className="w-4 h-4" />
                  Edit Full Details
                </button>
                <button
                  onClick={onAdjustStock}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: '#f0f4ff', color: '#2b4bb9', border: '1.5px solid #c7d2fe' }}
                >
                  <PackagePlus className="w-4 h-4" />
                  Adjust Stock
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


function Pagination({ page, totalPages, total, pageSize, onChange }: {
  page: number; totalPages: number; total: number; pageSize: number; onChange: (p: number) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const pages: (number | '...')[] = []
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #f0f2ff' }}>
      <span className="text-sm" style={{ color: '#6b7280' }}>
        Showing <strong style={{ color: '#0f1623' }}>{from}</strong> to <strong style={{ color: '#0f1623' }}>{to}</strong> of <strong style={{ color: '#0f1623' }}>{total}</strong> products
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40"
          style={{ color: '#6b7280', background: '#f8faff' }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) => p === '...'
          ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: '#9ca3af' }}>...</span>
          : <button
            key={p}
            onClick={() => onChange(p as number)}
            className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
            style={p === page
              ? { background: '#2b4bb9', color: '#fff' }
              : { background: '#f8faff', color: '#374151' }
            }
          >{p}</button>
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40"
          style={{ color: '#6b7280', background: '#f8faff' }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Product Row ───────────────────────────────────────────────────────────────

function ProductRow({ product, index, onView, onEdit, onStock }: {
  product: ProductListItem
  index: number
  onView: () => void
  onEdit: () => void
  onStock: () => void
}) {
  const health = stockHealth(product.totalStock)
  const badge = statusBadge(product.status)
  const productId = getProductDisplayId(product)

  return (
    <tr
      className="transition-colors"
      style={{ borderBottom: '1px solid #f4f5ff' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* ID */}
      <td className="py-5 px-6">
        <span className="text-xs font-mono font-bold" style={{ color: '#2b4bb9' }}>
          {productId}
        </span>
      </td>

      {/* Product */}
      <td className="py-5 px-6">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ background: '#eef2ff' }}>
            <img src={getProductImage(product)} alt={product.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-snug" style={{ color: '#0f1623' }}>{product.title}</p>
            <p className="text-xs mt-0.5 font-mono" style={{ color: '#9ca3af' }}>{product.slug}</p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="py-5 px-6">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-lg"
          style={{ background: badge.bg, color: badge.text }}
        >
          {badge.label}
        </span>
      </td>

      <td className="py-5 px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums" style={{ color: '#0f1623' }}>
            {product.totalStock.toLocaleString()}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: health.color + '18', color: health.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: health.color }} />
            {health.label}
          </span>
        </div>
      </td>

      <td className="py-5 px-6">
        <p className="text-sm font-bold tabular-nums" style={{ color: '#2b4bb9' }}>${product.price.toFixed(2)}</p>
        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Updated {formatDate(product.updatedAt)}</p>
      </td>

      <td className="py-5 px-6">
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#eef2ff]"
            style={{ color: '#2b4bb9' }}
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#f4f5ff]"
            style={{ color: '#6b7280' }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={onStock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#f0fdf4]"
            style={{ color: '#16a34a' }}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            Stock
          </button>
        </div>
      </td>
    </tr>
  )
}


function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #f4f5ff' }}>
      {[60, 220, 90, 130, 90, 160].map((w, i) => (
        <td key={i} className="py-5 px-6">
          <div
            className="h-3.5 rounded-md animate-pulse"
            style={{ width: `${w}px`, background: '#f0f2ff' }}
          />
        </td>
      ))}
    </tr>
  )
}


export default function ProductsPage() {
  const { currentUser } = useApp()
  const router = useRouter()
  const isAdmin = currentUser?.roles.includes('admin')

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null)
  const [page, setPage] = useState(1)

  const productsQuery = useProductsQuery({
    page,
    limit: PAGE_SIZE,
    search: deferredSearch.trim() || undefined,
  })

  const products = productsQuery.data?.items ?? []
  const totalProducts = productsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  useEffect(() => {
    if (safePage !== page) {
      setPage(safePage)
    }
  }, [page, safePage])

  const lowStockCount = useMemo(
    () => products.filter(product => product.totalStock > 0 && product.totalStock <= 40).length,
    [products],
  )

  const inStockCount = useMemo(
    () => products.filter(product => product.totalStock > 0).length,
    [products],
  )

  const isFiltering = search !== deferredSearch

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f8faff' }}>
      <Topbar title="Products" description="Manage your product catalog" />

      <div className="flex-1 p-4 md:p-8 max-w-360">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between mb-6 md:mb-8">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-balance"
              style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.02em' }}
            >
              Product Inventory
            </h1>
            <p className="text-sm mt-1.5 max-w-md hidden sm:block" style={{ color: '#6b7280', lineHeight: '1.5' }}>
              Browse your live catalog, search backend records, and manage stock operations from a single inventory view.
            </p>
          </div>
          {isAdmin && (
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap self-start shrink-0"
              style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)', boxShadow: '0 4px 14px rgba(43,75,185,0.3)' }}
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">
          <div
            className="flex items-center gap-4 px-6 py-5 rounded-2xl"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', minWidth: '180px' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#eef2ff' }}>
              <Package className="w-5 h-5" style={{ color: '#2b4bb9' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9ca3af' }}>Total Products</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.03em' }}>
                {totalProducts.toLocaleString()}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-4 px-6 py-5 rounded-2xl"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', minWidth: '180px' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fef2f2' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9ca3af' }}>Low Stock In View</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#dc2626', letterSpacing: '-0.03em' }}>
                {lowStockCount}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-4 px-6 py-5 rounded-2xl"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#f0fdf4' }}>
              <Eye className="w-5 h-5" style={{ color: '#16a34a' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9ca3af' }}>Products In View</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#16a34a', letterSpacing: '-0.03em' }}>
                {inStockCount}/{products.length}
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
          style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: '#9ca3af' }} />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by title or slug..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: '#0f1623' }}
          />
          {productsQuery.isFetching && (
            <div className="flex items-center gap-2 text-xs shrink-0" style={{ color: '#6b7280' }}>
              <RefreshCw className={`w-3.5 h-3.5 ${isFiltering ? 'animate-spin' : ''}`} />
              {isFiltering ? 'Searching...' : 'Syncing...'}
            </div>
          )}
          {search && (
            <button onClick={() => handleSearch('')} style={{ color: '#9ca3af' }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f4f5ff', background: '#fafbff' }}>
                {['ID', 'Product', 'Status', 'Stock Level', 'Pricing', 'Actions'].map(label => (
                  <th
                    key={label}
                    className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: '#9ca3af' }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productsQuery.isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonRow key={`loading-${i}`} />
                ))
              ) : productsQuery.isError ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center px-6">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" style={{ color: '#dc2626' }} />
                    <p className="text-sm font-semibold mb-1" style={{ color: '#0f1623' }}>Unable to load products</p>
                    <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
                      {getApiErrorMessage(productsQuery.error, 'Product list request failed.')}
                    </p>
                    <button
                      onClick={() => productsQuery.refetch()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                      style={{ background: '#eef2ff', color: '#2b4bb9' }}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#9ca3af' }} />
                    <p className="text-sm" style={{ color: '#9ca3af' }}>
                      {deferredSearch ? 'No products match your search' : 'No products found'}
                    </p>
                  </td>
                </tr>
              ) : (
                <>
                  {products.map((p, i) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      index={(safePage - 1) * PAGE_SIZE + i}
                      onView={() => setSelectedProduct(p)}
                      onEdit={() => { }}
                      onStock={() => router.push(`/dashboard/products/${p.id}/stock`)}
                    />
                  ))}
                  {products.length < PAGE_SIZE && Array.from({ length: PAGE_SIZE - products.length }).map((_, i) => (
                    <SkeletonRow key={`sk-${i}`} />
                  ))}
                </>
              )}
            </tbody>
          </table>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            total={totalProducts}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdjustStock={() => {
            router.push(`/dashboard/products/${selectedProduct.id}/stock`)
            setSelectedProduct(null)
          }}
        />
      )}
    </div>
  )
}
