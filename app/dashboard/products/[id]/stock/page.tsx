'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { DUMMY_PRODUCTS, DUMMY_STOCK_MOVEMENTS } from '@/lib/dummy-data'
import { ChevronLeft, Plus, Minus, RefreshCw, RotateCcw, Wrench, ChevronDown, BookOpen } from 'lucide-react'
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts'

const WAREHOUSES = [
  'Central Distribution (North)',
  'West Hub',
  'East Hub',
  'South Fulfillment',
]

type AdjustmentType = 'add' | 'remove'
type Reason = 'restock' | 'return' | 'correction'

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  if (d === 1) return 'Yesterday'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function stockHealth(stock: number): { label: string; color: string } {
  if (stock === 0) return { label: 'Out of Stock', color: '#dc2626' }
  if (stock <= 10) return { label: 'Critical', color: '#dc2626' }
  if (stock <= 40) return { label: 'Low', color: '#f59e0b' }
  if (stock <= 150) return { label: 'Moderate', color: '#3b82f6' }
  return { label: 'Healthy', color: '#16a34a' }
}

export default function StockAdjustmentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const product = DUMMY_PRODUCTS.find(p => p.id === id)
  const movements = DUMMY_STOCK_MOVEMENTS.filter(m => m.productId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  const [adjustType, setAdjustType] = useState<AdjustmentType>('add')
  const [quantity, setQuantity] = useState<number | ''>('')
  const [warehouse, setWarehouse] = useState(WAREHOUSES[0])
  const [reason, setReason] = useState<Reason>('restock')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: '#f8faff' }}>
        <Topbar title="Stock Adjustment" description="" />
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: '#9ca3af' }}>Product not found.</p>
        </div>
      </div>
    )
  }

  const health = stockHealth(product.stock)

  // Capacity bar chart — mock weekly data
  const capacityData = [
    { day: 'M', v: 55 }, { day: 'T', v: 62 }, { day: 'W', v: 48 },
    { day: 'T', v: 70 }, { day: 'F', v: 85 }, { day: 'S', v: 78 }, { day: 'S', v: 90 },
  ]

  const handleSave = async () => {
    if (!quantity || Number(quantity) <= 0) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    router.push('/dashboard/products')
  }

  const REASONS: { id: Reason; label: string; icon: React.ReactNode }[] = [
    { id: 'restock', label: 'Restock', icon: <RefreshCw className="w-5 h-5" /> },
    { id: 'return', label: 'Return', icon: <RotateCcw className="w-5 h-5" /> },
    { id: 'correction', label: 'Correction', icon: <Wrench className="w-5 h-5" /> },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f8faff' }}>
      <Topbar title="Stock Adjustment" description="" />

      <div className="flex-1 p-4 md:p-8 max-w-[1440px]">
        {/* Back link */}
        <button
          onClick={() => router.push('/dashboard/products')}
          className="flex items-center gap-2 text-sm font-medium mb-7 transition-opacity hover:opacity-70"
          style={{ color: '#2b4bb9' }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </button>

        {/* Hero banner */}
        <div
          className="rounded-2xl px-8 py-7 mb-8 flex items-center justify-between gap-6"
          style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6366f1' }}>
              Stock Adjustment
            </p>
            <h1
              className="text-2xl font-bold text-balance"
              style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.02em' }}
            >
              {product.name}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>SKU: {product.sku}</p>
          </div>

          <div
            className="flex items-center gap-8 px-8 py-5 rounded-2xl flex-shrink-0"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(19,27,46,0.06)' }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>Current Stock</p>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-3xl font-bold"
                  style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.03em' }}
                >
                  {product.stock.toLocaleString()}
                </span>
                <span className="text-sm" style={{ color: '#9ca3af' }}>units</span>
              </div>
            </div>
            <div className="w-px h-10" style={{ background: '#e5e7eb' }} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9ca3af' }}>Status</p>
              <span
                className="text-sm font-bold px-3 py-1.5 rounded-full"
                style={{ background: '#dcfce7', color: '#15803d' }}
              >
                {health.label}
              </span>
            </div>
          </div>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
          {/* Left: Adjustment form */}
          <div
            className="rounded-2xl p-8"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}
          >
            <h2 className="text-xl font-bold mb-7" style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.02em' }}>
              Adjustment Details
            </h2>

            {/* Adjustment Type */}
            <div className="mb-7">
              <label className="block text-sm font-semibold mb-3" style={{ color: '#374151' }}>
                Adjustment Type
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setAdjustType('add')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={adjustType === 'add'
                    ? { background: '#2b4bb9', color: '#fff', boxShadow: '0 4px 12px rgba(43,75,185,0.25)' }
                    : { background: '#f8faff', color: '#374151', border: '1.5px solid #e5e7eb' }
                  }
                >
                  <Plus className="w-4 h-4" />
                  Add Stock
                </button>
                <button
                  onClick={() => setAdjustType('remove')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={adjustType === 'remove'
                    ? { background: '#0f1623', color: '#fff' }
                    : { background: '#f8faff', color: '#374151', border: '1.5px solid #e5e7eb' }
                  }
                >
                  <Minus className="w-4 h-4" />
                  Remove Stock
                </button>
              </div>
            </div>

            {/* Quantity + Warehouse */}
            <div className="grid grid-cols-2 gap-5 mb-7">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>Quantity</label>
                <div
                  className="flex items-center rounded-xl px-4 py-3 transition-all focus-within:ring-2"
                  style={{ background: '#f8faff', border: '1.5px solid #e5e7eb' }}
                >
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: '#0f1623' }}
                  />
                  <span className="text-sm ml-2" style={{ color: '#9ca3af' }}>units</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>Warehouse Location</label>
                <div
                  className="relative flex items-center rounded-xl px-4 py-3"
                  style={{ background: '#f8faff', border: '1.5px solid #e5e7eb' }}
                >
                  <select
                    value={warehouse}
                    onChange={e => setWarehouse(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none appearance-none pr-5"
                    style={{ color: '#0f1623' }}
                  >
                    {WAREHOUSES.map(w => <option key={w}>{w}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 pointer-events-none" style={{ color: '#9ca3af' }} />
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="mb-7">
              <label className="block text-sm font-semibold mb-3" style={{ color: '#374151' }}>
                Reason for Adjustment
              </label>
              <div className="grid grid-cols-3 gap-3">
                {REASONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold transition-all"
                    style={reason === r.id
                      ? { background: '#f0f4ff', color: '#2b4bb9', border: '2px solid #2b4bb9' }
                      : { background: '#f8faff', color: '#6b7280', border: '2px solid #e5e7eb' }
                    }
                  >
                    {r.icon}
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                Internal Notes <span className="font-normal" style={{ color: '#9ca3af' }}>(Optional)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Add additional context for this adjustment..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-y transition-all focus:ring-2 focus:ring-blue-200"
                style={{ background: '#f8faff', border: '1.5px solid #e5e7eb', color: '#0f1623', fontFamily: 'inherit' }}
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!quantity || Number(quantity) <= 0 || saving}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)', boxShadow: '0 4px 14px rgba(43,75,185,0.3)' }}
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <BookOpen className="w-4 h-4" />
              )}
              Save Adjustment
            </button>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Recent Movements */}
            <div
              className="rounded-2xl p-6"
              style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-5">
                <RefreshCw className="w-4 h-4" style={{ color: '#6366f1' }} />
                <h3 className="text-sm font-bold" style={{ color: '#0f1623' }}>Recent Movements</h3>
              </div>

              <div className="space-y-4">
                {movements.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: '#9ca3af' }}>No recent movements</p>
                ) : (
                  movements.map(m => (
                    <div key={m.id} className="flex items-start gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: m.type === 'add' ? '#dcfce7' : '#fee2e2' }}
                      >
                        {m.type === 'add'
                          ? <Plus className="w-3.5 h-3.5" style={{ color: '#16a34a' }} />
                          : <Minus className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#0f1623' }}>
                          {m.type === 'add' ? '+' : '-'}{m.quantity} units
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                          {m.notes || m.reason.charAt(0).toUpperCase() + m.reason.slice(1)} • {formatRelative(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                className="mt-5 text-xs font-semibold"
                style={{ color: '#2b4bb9' }}
              >
                View Full Ledger
              </button>
            </div>

            {/* Storage Capacity */}
            <div
              className="rounded-2xl p-6"
              style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}
            >
              <h3 className="text-sm font-bold mb-4" style={{ color: '#0f1623' }}>Storage Capacity</h3>

              <div className="h-24 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={capacityData} barSize={10}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                      {capacityData.map((_, i) => (
                        <Cell key={i} fill={i === capacityData.length - 1 ? '#2b4bb9' : '#e0e7ff'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
                <strong style={{ color: '#0f1623' }}>85% Capacity</strong> utilized in Central Distribution North. Consider balancing stock across regional hubs if adjustment exceeds 500 units.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
