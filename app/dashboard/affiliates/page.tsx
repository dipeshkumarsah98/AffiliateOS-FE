'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Topbar } from '@/components/layout/Topbar'
import { DUMMY_AFFILIATES, DUMMY_PRODUCTS } from '@/lib/dummy-data'
import type { Affiliate, AffiliateType } from '@/lib/types'
import {
  Plus, X, RefreshCw, Search, User, ShieldOff,
  ChevronRight, ChevronDown, Mail, Phone, Building2, Check,
  Edit2, Trash2, Eye,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// ---- Helpers ----
function generateCode(name: string) {
  const base = name.toUpperCase().replace(/\s+/g, '').slice(0, 6)
  const num = Math.floor(Math.random() * 90 + 10)
  return `${base}${num}`
}

const AFFILIATE_TYPE_LABELS: Record<AffiliateType, string> = {
  influencer: 'Influencer',
  creator: 'Creator',
  shop_owner: 'Shop Owner',
  blogger: 'Blogger',
  other: 'Other',
}

const AFFILIATE_TYPE_COLORS: Record<AffiliateType, { bg: string; fg: string }> = {
  influencer: { bg: '#ede9fe', fg: '#5b21b6' },
  creator: { bg: '#dbeafe', fg: '#1d4ed8' },
  shop_owner: { bg: '#d1fae5', fg: '#065f46' },
  blogger: { bg: '#fef3c7', fg: '#92400e' },
  other: { bg: '#f1f5f9', fg: '#475569' },
}

// ---- Register/Edit Modal ----
interface RegisterModalProps {
  affiliate?: Affiliate
  onClose: () => void
}

function RegisterAffiliateModal({ affiliate, onClose }: RegisterModalProps) {
  const isEdit = !!affiliate
  const [form, setForm] = useState({
    fullName: affiliate?.fullName ?? '',
    email: affiliate?.email ?? '',
    affiliateType: (affiliate?.affiliateType ?? 'influencer') as AffiliateType,
    contactNumber: affiliate?.contactNumber ?? '',
    physicalAddress: affiliate?.physicalAddress ?? '',
    productSearch: '',
    selectedProductIds: affiliate?.linkedProductIds ?? [] as string[],
    affiliateCode: affiliate?.affiliateCode ?? '',
    discountType: (affiliate?.discountType ?? 'fixed') as 'fixed' | 'percentage',
    discountValue: affiliate?.discountValue?.toString() ?? '0.00',
    commissionType: (affiliate?.commissionType ?? 'percentage') as 'fixed' | 'percentage',
    commissionValue: affiliate?.commissionValue?.toString() ?? '15',
    bankName: affiliate?.bankName ?? '',
    accountNumber: affiliate?.accountNumber ?? '',
  })
  const [done, setDone] = useState(false)

  function set(key: keyof typeof form) {
    return (v: string) => setForm(f => ({ ...f, [key]: v }))
  }

  function regenerateCode() {
    setForm(f => ({ ...f, affiliateCode: generateCode(f.fullName || 'PARTNER') }))
  }

  function toggleProduct(id: string) {
    setForm(f => ({
      ...f,
      selectedProductIds: f.selectedProductIds.includes(id)
        ? f.selectedProductIds.filter(p => p !== id)
        : [...f.selectedProductIds, id],
    }))
  }

  const filteredProducts = DUMMY_PRODUCTS.filter(p =>
    p.available && p.name.toLowerCase().includes(form.productSearch.toLowerCase())
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDone(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(19,27,46,0.5)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl my-8 animate-fade-in-up"
        style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 24px 60px rgba(19,27,46,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-5 sm:py-6" style={{ borderBottom: '1px solid rgba(195,197,220,0.2)' }}>
          <div>
            <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--on-surface-variant)' }}>
              <span>Affiliate</span>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: 'var(--primary)' }}>{isEdit ? 'Edit Affiliate' : 'Create New Affiliate'}</span>
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              {isEdit ? 'Edit Affiliate' : 'Register Affiliate'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
              Configure a new partner profile and commission structure.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-container-high)]"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--tertiary-container)' }}>
              <Check className="w-8 h-8" style={{ color: 'var(--tertiary)' }} />
            </div>
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)' }}>
              {isEdit ? 'Affiliate Updated!' : 'Affiliate Created & Linked!'}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--on-surface-variant)' }}>
              {isEdit ? 'Changes have been saved.' : 'The affiliate can now log in and start earning commissions.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="divide-y" style={{ '--divider': 'rgba(195,197,220,0.15)' } as React.CSSProperties}>

            {/* Section 1: Personal Details */}
            <div className="px-5 sm:px-8 py-5 sm:py-6 space-y-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-fixed)' }}>
                  <User className="w-4 h-4" style={{ color: 'var(--on-primary-fixed)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Personal Details</p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Identification and contact information.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                    Full Name <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    required
                    value={form.fullName}
                    onChange={e => set('fullName')(e.target.value)}
                    placeholder="e.g. Alexander Pierce"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '2px solid transparent' }}
                    onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}
                    onBlur={e => { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                    Email Address <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => set('email')(e.target.value)}
                    placeholder="alex@partnership.com"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '2px solid transparent' }}
                    onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}
                    onBlur={e => { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                    Affiliate Type
                  </label>
                  <div className="relative">
                    <select
                      value={form.affiliateType}
                      onChange={e => set('affiliateType')(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none transition-all"
                      style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '2px solid transparent' }}
                      onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)' }}
                      onBlur={e => { e.currentTarget.style.border = '2px solid transparent' }}
                    >
                      <option value="influencer">Influencer</option>
                      <option value="creator">Creator</option>
                      <option value="shop_owner">Shop Owner</option>
                      <option value="blogger">Blogger</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                    Contact Number
                  </label>
                  <input
                    value={form.contactNumber}
                    onChange={e => set('contactNumber')(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '2px solid transparent' }}
                    onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}
                    onBlur={e => { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                  Physical Address
                </label>
                <textarea
                  value={form.physicalAddress}
                  onChange={e => set('physicalAddress')(e.target.value)}
                  placeholder="Street, Suite, City, State, Zip"
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg text-sm resize-none outline-none transition-all"
                  style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '2px solid transparent' }}
                  onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}
                  onBlur={e => { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
                />
              </div>
            </div>

            {/* Section 2: Affiliate Details */}
            <div className="px-5 sm:px-8 py-5 sm:py-6 space-y-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#d1fae5' }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Affiliate Details</p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Product linking and commercial terms.</p>
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                  Product Selection
                </label>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ background: 'var(--surface-container-low)', border: '2px solid transparent' }}
                >
                  <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(195,197,220,0.2)' }}>
                    <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--on-surface-variant)' }} />
                    <input
                      value={form.productSearch}
                      onChange={e => set('productSearch')(e.target.value)}
                      placeholder="Search for products to link..."
                      className="flex-1 text-sm bg-transparent outline-none"
                      style={{ color: 'var(--on-surface)' }}
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto p-2 space-y-1">
                    {filteredProducts.map(p => {
                      const selected = form.selectedProductIds.includes(p.id)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleProduct(p.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors"
                          style={{
                            background: selected ? 'var(--primary-fixed)' : 'transparent',
                            color: selected ? 'var(--on-primary-fixed)' : 'var(--on-surface)',
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                            style={{
                              background: selected ? 'var(--primary)' : 'transparent',
                              border: selected ? 'none' : '2px solid var(--outline)',
                            }}
                          >
                            {selected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="truncate flex-1">{p.name}</span>
                          <span className="text-xs opacity-60">${p.price}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {form.selectedProductIds.length > 0 && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                    {form.selectedProductIds.length} product{form.selectedProductIds.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Affiliate Code */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                  Affiliate Code
                </label>
                <div className="flex gap-2">
                  <input
                    required
                    value={form.affiliateCode}
                    onChange={e => set('affiliateCode')(e.target.value.toUpperCase())}
                    placeholder="EX-PARTNER-2024"
                    className="flex-1 px-4 py-3 rounded-lg text-sm font-mono outline-none transition-all uppercase"
                    style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '2px solid transparent' }}
                    onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}
                    onBlur={e => { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
                  />
                  <button
                    type="button"
                    onClick={regenerateCode}
                    className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors hover:opacity-80 flex-shrink-0"
                    style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}
                    title="Regenerate code"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Discount + Commission side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Discount */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--surface-container-low)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                      Discount Configuration
                    </span>
                    <div className="flex gap-1">
                      {(['fixed', 'percentage'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => set('discountType')(t)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-md transition-all"
                          style={
                            form.discountType === t
                              ? { background: 'var(--primary)', color: 'white' }
                              : { background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }
                          }
                        >
                          {t === 'fixed' ? 'FIXED' : '%'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                      Discount Value
                    </label>
                    <div className="relative">
                      {form.discountType === 'fixed' && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>$</span>
                      )}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.discountValue}
                        onChange={e => set('discountValue')(e.target.value)}
                        className="w-full py-2.5 rounded-lg text-sm outline-none transition-all"
                        style={{
                          background: 'var(--surface-container-lowest)',
                          color: 'var(--on-surface)',
                          border: '2px solid transparent',
                          paddingLeft: form.discountType === 'fixed' ? '1.75rem' : '0.875rem',
                          paddingRight: form.discountType === 'percentage' ? '1.75rem' : '0.875rem',
                        }}
                        onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)' }}
                        onBlur={e => { e.currentTarget.style.border = '2px solid transparent' }}
                      />
                      {form.discountType === 'percentage' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>%</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Commission */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--surface-container-low)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--tertiary)' }}>
                      Commission Configuration
                    </span>
                    <div className="flex gap-1">
                      {(['fixed', 'percentage'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => set('commissionType')(t)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-md transition-all"
                          style={
                            form.commissionType === t
                              ? { background: 'var(--primary)', color: 'white' }
                              : { background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }
                          }
                        >
                          {t === 'fixed' ? 'FIXED' : '%'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                      Commission {form.commissionType === 'percentage' ? 'Percentage' : 'Value'}
                    </label>
                    <div className="relative">
                      {form.commissionType === 'fixed' && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>$</span>
                      )}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.commissionValue}
                        onChange={e => set('commissionValue')(e.target.value)}
                        className="w-full py-2.5 rounded-lg text-sm outline-none transition-all"
                        style={{
                          background: 'var(--surface-container-lowest)',
                          color: 'var(--on-surface)',
                          border: '2px solid transparent',
                          paddingLeft: form.commissionType === 'fixed' ? '1.75rem' : '0.875rem',
                          paddingRight: form.commissionType === 'percentage' ? '1.75rem' : '0.875rem',
                        }}
                        onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)' }}
                        onBlur={e => { e.currentTarget.style.border = '2px solid transparent' }}
                      />
                      {form.commissionType === 'percentage' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Bank Details */}
            <div className="px-5 sm:px-8 py-5 sm:py-6 space-y-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--warning-container)' }}>
                  <Building2 className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Bank Details</p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Payout information for commission settlements.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                    Bank Name
                  </label>
                  <input
                    value={form.bankName}
                    onChange={e => set('bankName')(e.target.value)}
                    placeholder="e.g. Global Trust Bank"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '2px solid transparent' }}
                    onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}
                    onBlur={e => { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                    Account Number
                  </label>
                  <input
                    value={form.accountNumber}
                    onChange={e => set('accountNumber')(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-0000"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all font-mono"
                    style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '2px solid transparent' }}
                    onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}
                    onBlur={e => { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 sm:px-8 py-5 sm:py-6 flex items-center justify-end gap-3" style={{ borderTop: '1px solid rgba(195,197,220,0.2)' }}>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
              >
                {isEdit ? 'Save Changes' : 'Create Affiliate & Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ---- Affiliate Row ----
function AffiliateRow({
  affiliate,
  onEdit,
  onView,
}: {
  affiliate: Affiliate
  onEdit: (a: Affiliate) => void
  onView: (a: Affiliate) => void
}) {
  const typeColors = AFFILIATE_TYPE_COLORS[affiliate.affiliateType]
  const isActive = affiliate.status === 'active'
  return (
    <tr
      style={{ borderBottom: '1px solid #f4f5ff' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Affiliate name + email */}
      <td className="py-5 px-6">
        <div className="flex items-center gap-3.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{ background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed)' }}
          >
            {affiliate.fullName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{affiliate.fullName}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{affiliate.email}</p>
          </div>
        </div>
      </td>

      {/* Type badge */}
      <td className="py-5 px-6">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-lg"
          style={{ background: typeColors.bg, color: typeColors.fg }}
        >
          {AFFILIATE_TYPE_LABELS[affiliate.affiliateType]}
        </span>
      </td>

      {/* Affiliate code */}
      <td className="py-5 px-6">
        <span
          className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg"
          style={{ background: '#eef2ff', color: '#2b4bb9' }}
        >
          {affiliate.affiliateCode}
        </span>
      </td>

      {/* Discount */}
      <td className="py-5 px-6">
        <span className="text-sm tabular-nums" style={{ color: '#374151' }}>
          {affiliate.discountType === 'percentage' ? `${affiliate.discountValue}%` : `$${affiliate.discountValue}`}
        </span>
      </td>

      {/* Commission */}
      <td className="py-5 px-6">
        <span className="text-sm font-semibold tabular-nums" style={{ color: '#16a34a' }}>
          {affiliate.commissionType === 'percentage' ? `${affiliate.commissionValue}%` : `$${affiliate.commissionValue}`}
        </span>
      </td>

      {/* Status dot-pill */}
      <td className="py-5 px-6">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={isActive
            ? { background: '#f0fdf4', color: '#15803d' }
            : { background: '#f4f5ff', color: '#6b7280' }
          }
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: isActive ? '#22c55e' : '#9ca3af' }}
          />
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </td>

      {/* Joined date */}
      <td className="py-5 px-6">
        <span className="text-sm" style={{ color: '#6b7280' }}>
          {new Date(affiliate.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </td>

      {/* Actions — text+icon like orders page */}
      <td className="py-5 px-6">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onView(affiliate)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#eef2ff]"
            style={{ color: '#2b4bb9' }}
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={() => onEdit(affiliate)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#f4f5ff]"
            style={{ color: '#6b7280' }}
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#fef2f2]"
            style={{ color: '#dc2626' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>
      </td>
    </tr>
  )
}

// ---- View Details Modal ----
function ViewAffiliateModal({ affiliate, onEdit, onClose }: { affiliate: Affiliate; onEdit: () => void; onClose: () => void }) {
  const typeColors = AFFILIATE_TYPE_COLORS[affiliate.affiliateType]
  const linkedProducts = DUMMY_PRODUCTS.filter(p => affiliate.linkedProductIds.includes(p.id))
  const isActive = affiliate.status === 'active'

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
                {AFFILIATE_TYPE_LABELS[affiliate.affiliateType]}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: '#eef2ff', color: '#2b4bb9' }}
              >
                {affiliate.fullName.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
                  {affiliate.fullName}
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
              {[
                { Icon: Mail, label: 'Email', value: affiliate.email },
                { Icon: Phone, label: 'Phone', value: affiliate.contactNumber },
                { Icon: Building2, label: 'Address', value: affiliate.physicalAddress },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#f8faff' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: '#6b7280' }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>{label}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: '#0f172a' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Linked products */}
          {linkedProducts.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Linked Products</p>
              <div className="space-y-2">
                {linkedProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#f8faff' }}>
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#eef2ff' }}>
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm flex-1 font-medium truncate" style={{ color: '#0f172a' }}>{p.name}</span>
                    <span className="text-xs font-semibold" style={{ color: '#6b7280' }}>${p.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Commission & Actions ── */}
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
              {affiliate.affiliateCode}
            </p>
          </div>

          {/* Discount tile */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>Discount</p>
            <p className="text-2xl font-bold" style={{ color: '#0f172a', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
              {affiliate.discountType === 'percentage' ? `${affiliate.discountValue}%` : `$${affiliate.discountValue}`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {affiliate.discountType === 'percentage' ? 'Percentage off order' : 'Fixed amount off'}
            </p>
          </div>

          {/* Commission tile */}
          <div className="rounded-xl p-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#15803d', opacity: 0.7 }}>Commission</p>
            <p className="text-2xl font-bold" style={{ color: '#15803d', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
              {affiliate.commissionType === 'percentage' ? `${affiliate.commissionValue}%` : `$${affiliate.commissionValue}`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#15803d', opacity: 0.7 }}>
              {affiliate.commissionType === 'percentage' ? 'Per sale' : 'Fixed per sale'}
            </p>
          </div>

          {/* Bank info */}
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Bank Details</p>
            <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{affiliate.bankName}</p>
            <p className="text-xs font-mono mt-1" style={{ color: '#6b7280' }}>{affiliate.accountNumber}</p>
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
export default function AffiliatesPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const router = useRouter()
  const [viewAffiliate, setViewAffiliate] = useState<Affiliate | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<AffiliateType | 'all'>('all')

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

  const filtered = DUMMY_AFFILIATES.filter(a => {
    const matchSearch = a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.affiliateCode.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || a.affiliateType === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Affiliates" description="Onboard and manage your affiliate partners" />

      <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-6 max-w-[1440px]">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Total Affiliates', value: DUMMY_AFFILIATES.length.toString(), color: 'var(--primary)' },
            { label: 'Active', value: DUMMY_AFFILIATES.filter(a => a.status === 'active').length.toString(), color: 'var(--tertiary)' },
            { label: 'Inactive', value: DUMMY_AFFILIATES.filter(a => a.status === 'inactive').length.toString(), color: 'var(--on-surface-variant)' },
            { label: 'Products Linked', value: [...new Set(DUMMY_AFFILIATES.flatMap(a => a.linkedProductIds))].length.toString(), color: '#7c3aed' },
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
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or affiliate code..."
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: '#0f172a' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: '#9ca3af' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as AffiliateType | 'all')}
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
              <option value="creator">Creator</option>
              <option value="shop_owner">Shop Owner</option>
              <option value="blogger">Blogger</option>
              <option value="other">Other</option>
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
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--on-surface-variant)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>No affiliates found</p>
              <button onClick={() => router.push('/dashboard/affiliates/new')} className="mt-3 text-xs font-medium" style={{ color: 'var(--primary)' }}>
                Register your first affiliate →
              </button>
            </div>
          ) : (
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
                  {filtered.map(a => (
                    <AffiliateRow
                      key={a.id}
                      affiliate={a}
                      onEdit={af => router.push(`/dashboard/affiliates/${af.id}/edit`)}
                      onView={af => setViewAffiliate(af)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-6 py-3.5 flex items-center justify-between" style={{ borderTop: '1px solid rgba(195,197,220,0.15)' }}>
            <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              Showing {filtered.length} of {DUMMY_AFFILIATES.length} affiliates
            </span>
          </div>
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
