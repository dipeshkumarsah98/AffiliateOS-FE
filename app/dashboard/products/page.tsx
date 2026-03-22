'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/store'
import { Topbar } from '@/components/layout/Topbar'
import { DUMMY_PRODUCTS } from '@/lib/dummy-data'
import type { Product } from '@/lib/types'
import {
  Search, Plus, X, Package, Eye, Pencil, PackagePlus,
  ChevronLeft, ChevronRight, AlertTriangle, Filter,
  Link2,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES = ['All Products', 'Electronics', 'Peripherals', 'Furniture', 'Accessories']

const PAGE_SIZE = 5

function stockHealth(stock: number): { label: string; color: string; bar: string; pct: number } {
  if (stock === 0) return { label: 'Out of Stock', color: '#dc2626', bar: '#dc2626', pct: 0 }
  if (stock <= 10) return { label: 'Critical', color: '#dc2626', bar: '#dc2626', pct: Math.min(100, (stock / 10) * 100) }
  if (stock <= 40) return { label: 'Low', color: '#f59e0b', bar: '#f59e0b', pct: Math.min(100, (stock / 100) * 100) }
  if (stock <= 150) return { label: 'Moderate', color: '#3b82f6', bar: '#3b82f6', pct: Math.min(100, (stock / 200) * 100) }
  if (stock === Infinity || stock > 5000) return { label: 'Managed', color: '#2b4bb9', bar: '#2b4bb9', pct: 100 }
  return { label: 'Healthy', color: '#16a34a', bar: '#16a34a', pct: Math.min(100, (stock / 400) * 100) }
}

function categoryColor(cat: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    Electronics: { bg: '#eff6ff', text: '#1d4ed8' },
    Peripherals: { bg: '#f0fdf4', text: '#15803d' },
    Furniture: { bg: '#fff7ed', text: '#c2410c' },
    Accessories: { bg: '#fdf4ff', text: '#7e22ce' },
  }
  return map[cat] || { bg: '#f8faff', text: '#374151' }
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────

function ProductDetailModal({ product, onClose, onAdjustStock }: {
  product: Product
  onClose: () => void
  onAdjustStock: () => void
}) {
  const { currentUser } = useApp()
  const isAdmin = currentUser?.roles.includes('admin')
  const health = stockHealth(product.stock)
  const commissionValue = ((product.commissionRate / 100) * product.price).toFixed(2)

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
          {/* Left: image */}
          <div className="w-64 flex-shrink-0 relative" style={{ background: '#111' }}>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              style={{ minHeight: '400px' }}
            />
          </div>

          {/* Right: details */}
          <div className="flex-1 p-7 flex flex-col">
            {/* Header row */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
                  style={product.available && product.stock > 0
                    ? { background: '#dcfce7', color: '#15803d' }
                    : { background: '#fee2e2', color: '#dc2626' }
                  }
                >
                  {product.available && product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
                <span className="text-xs" style={{ color: '#6b7280' }}>SKU: {product.sku}</span>
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
              {product.name}
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

            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-xl p-4" style={{ background: '#f8faff' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6b7280' }}>Stock Level</p>
                <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.02em' }}>
                  {product.stock === 0 ? '0 Units' : `${product.stock} Units`}
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ background: '#f8faff' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6b7280' }}>Commission</p>
                <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#16a34a', letterSpacing: '-0.02em' }}>
                  {product.commissionRate}% (${commissionValue})
                </p>
              </div>
            </div>

            {/* Actions */}
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

// ─── Pagination ────────────────────────────────────────────────────────────────

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
  product: Product
  index: number
  onView: () => void
  onEdit: () => void
  onStock: () => void
}) {
  const health = stockHealth(product.stock)
  const catColor = categoryColor(product.category)
  const productId = `#EP-${String(4920 + index).padStart(4, '0')}`

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
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#eef2ff' }}>
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-snug" style={{ color: '#0f1623' }}>{product.name}</p>
            <p className="text-xs mt-0.5 font-mono" style={{ color: '#9ca3af' }}>{product.sku}</p>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="py-5 px-6">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-lg"
          style={{ background: catColor.bg, color: catColor.text }}
        >
          {product.category}
        </span>
      </td>

      {/* Stock Level — dot pill like orders status */}
      <td className="py-5 px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums" style={{ color: '#0f1623' }}>
            {product.stock.toLocaleString()}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: health.color + '18', color: health.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: health.color }} />
            {health.label}
          </span>
        </div>
      </td>

      {/* Commission */}
      <td className="py-5 px-6">
        <p className="text-sm font-bold tabular-nums" style={{ color: '#2b4bb9' }}>{product.commissionRate}%</p>
        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{product.commissionTier}</p>
      </td>

      {/* Actions — text+icon buttons like orders page */}
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

// ─── Skeleton Row ──────────────────────────────────────────────────────────────

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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { currentUser } = useApp()
  const router = useRouter()
  const isAdmin = currentUser?.roles.includes('admin')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Products')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [page, setPage] = useState(1)

  const totalSKUs = DUMMY_PRODUCTS.length
  const lowStock = DUMMY_PRODUCTS.filter(p => p.stock > 0 && p.stock <= 40).length

  const filtered = useMemo(() => {
    return DUMMY_PRODUCTS.filter(p => {
      const matchCat = category === 'All Products' || p.category === category
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [search, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    setPage(1)
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f8faff' }}>
      <Topbar title="Products" description="Manage your product catalog" />

      <div className="flex-1 p-4 md:p-8 max-w-[1440px]">

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
              Manage your ecosystem's product listings, monitor stock distribution levels, and adjust commission structures.
            </p>
          </div>
          {isAdmin && (
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap self-start flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)', boxShadow: '0 4px 14px rgba(43,75,185,0.3)' }}
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>

        {/* Stat cards + Category tabs row */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_auto_1fr] gap-3 md:gap-4 mb-5 md:mb-6">
          {/* Total SKUs */}
          <div
            className="flex items-center gap-4 px-6 py-5 rounded-2xl"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', minWidth: '180px' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eef2ff' }}>
              <Package className="w-5 h-5" style={{ color: '#2b4bb9' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9ca3af' }}>Total SKUs</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.03em' }}>
                {totalSKUs.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div
            className="flex items-center gap-4 px-6 py-5 rounded-2xl"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', minWidth: '180px' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fef2f2' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9ca3af' }}>Low Stock Alerts</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#dc2626', letterSpacing: '-0.03em' }}>
                {lowStock}
              </p>
            </div>
          </div>

          {/* Category tabs */}
          <div
            className="flex items-center gap-1 px-3 py-3 rounded-2xl overflow-x-auto"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className="whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={category === cat
                  ? { background: '#2b4bb9', color: '#fff' }
                  : { color: '#6b7280' }
                }
              >
                {cat}
              </button>
            ))}
            <button
              className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ color: '#9ca3af', background: '#f8faff' }}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
          style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#9ca3af' }} />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by product name, SKU, or category..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: '#0f1623' }}
          />
          {search && (
            <button onClick={() => handleSearch('')} style={{ color: '#9ca3af' }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f4f5ff', background: '#fafbff' }}>
                {['ID', 'Product', 'Category', 'Stock Level', 'Commission', 'Actions'].map(label => (
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#9ca3af' }} />
                    <p className="text-sm" style={{ color: '#9ca3af' }}>No products match your search</p>
                  </td>
                </tr>
              ) : (
                <>
                  {paginated.map((p, i) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      index={(safePage - 1) * PAGE_SIZE + i}
                      onView={() => setSelectedProduct(p)}
                      onEdit={() => {}}
                      onStock={() => router.push(`/dashboard/products/${p.id}/stock`)}
                    />
                  ))}
                  {/* skeleton filler */}
                  {paginated.length < PAGE_SIZE && Array.from({ length: PAGE_SIZE - paginated.length }).map((_, i) => (
                    <SkeletonRow key={`sk-${i}`} />
                  ))}
                </>
              )}
            </tbody>
          </table>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            total={filtered.length}
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
