'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User, Building2, RefreshCw, Search, Check, ChevronRight, ArrowLeft,
} from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { useApp } from '@/lib/store'
import { DUMMY_PRODUCTS, DUMMY_AFFILIATES } from '@/lib/dummy-data'
import type { AffiliateFormData } from '@/lib/affiliate-form-store'
import { saveFormDraft, loadFormDraft, generateAffiliateCode } from '@/lib/affiliate-form-store'

// ── Input helper component ──────────────────────────────────────────────────
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
        {label}{required && <span className="ml-0.5" style={{ color: 'var(--error)' }}>*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs" style={{ color: 'var(--error)' }}>{error}</p>}
    </div>
  )
}

function StyledInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
      style={{
        background: 'var(--surface-container-low)',
        color: 'var(--on-surface)',
        border: error ? '2px solid var(--error)' : '2px solid transparent',
      }}
      onFocus={e => {
        e.currentTarget.style.border = error ? '2px solid var(--error)' : '2px solid rgba(43,75,185,0.4)'
        e.currentTarget.style.background = 'var(--surface-container-lowest)'
      }}
      onBlur={e => {
        e.currentTarget.style.border = error ? '2px solid var(--error)' : '2px solid transparent'
        e.currentTarget.style.background = 'var(--surface-container-low)'
      }}
    />
  )
}

// ── Section card wrapper ────────────────────────────────────────────────────
function SectionCard({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl p-8 space-y-5" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 4px 24px rgba(19,27,46,0.04)' }}>
      <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid rgba(195,197,220,0.15)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <div>
          <p className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function NewAffiliatePage() {
  const { currentUser } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('editId')

  const [productSearch, setProductSearch] = useState('')

  const existingAffiliate = editId ? DUMMY_AFFILIATES.find(a => a.id === editId) : null
  const isEdit = !!existingAffiliate

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AffiliateFormData>({
    defaultValues: (() => {
      // Priority: sessionStorage draft → existing affiliate → defaults
      const draft = loadFormDraft()
      if (draft && draft.editId === editId) return draft
      if (existingAffiliate) {
        return {
          fullName: existingAffiliate.fullName,
          email: existingAffiliate.email,
          affiliateType: existingAffiliate.affiliateType,
          contactNumber: existingAffiliate.contactNumber,
          physicalAddress: existingAffiliate.physicalAddress,
          selectedProductIds: existingAffiliate.linkedProductIds,
          affiliateCode: existingAffiliate.affiliateCode,
          discountType: existingAffiliate.discountType,
          discountValue: String(existingAffiliate.discountValue),
          commissionType: existingAffiliate.commissionType,
          commissionValue: String(existingAffiliate.commissionValue),
          bankName: existingAffiliate.bankName,
          accountNumber: existingAffiliate.accountNumber,
          editId: editId ?? undefined,
        }
      }
      return {
        fullName: '', email: '', affiliateType: 'influencer', contactNumber: '',
        physicalAddress: '', selectedProductIds: [], affiliateCode: '',
        discountType: 'fixed', discountValue: '0.00',
        commissionType: 'percentage', commissionValue: '15',
        bankName: '', accountNumber: '', editId: undefined,
      }
    })(),
  })

  const watchedValues = watch()
  const discountType = watch('discountType')
  const commissionType = watch('commissionType')
  const selectedProductIds = watch('selectedProductIds')
  const affiliateCode = watch('affiliateCode')
  const fullName = watch('fullName')

  // Redirect non-admins
  useEffect(() => {
    if (currentUser && !currentUser.roles.includes('admin')) {
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  function regenerateCode() {
    setValue('affiliateCode', generateAffiliateCode(fullName || 'PARTNER'), { shouldValidate: true })
  }

  function toggleProduct(id: string) {
    const current = selectedProductIds ?? []
    if (current.includes(id)) {
      setValue('selectedProductIds', current.filter(p => p !== id), { shouldValidate: true })
    } else {
      setValue('selectedProductIds', [...current, id], { shouldValidate: true })
    }
  }

  const filteredProducts = DUMMY_PRODUCTS.filter(
    p => p.available && p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  function onSubmit(data: AffiliateFormData) {
    saveFormDraft({ ...data, editId: editId ?? undefined })
    router.push('/dashboard/affiliates/new/review')
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--surface)' }}>
      <Topbar title={isEdit ? 'Edit Affiliate' : 'New Affiliate'} />

      <main className="flex-1 p-6 lg:p-8 max-w-3xl mx-auto w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--on-surface-variant)' }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard/affiliates')}
            className="hover:underline"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            Affiliates
          </button>
          <ChevronRight className="w-3 h-3" />
          <span style={{ color: 'var(--primary)' }}>{isEdit ? 'Edit Affiliate' : 'Create New Affiliate'}</span>
        </div>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
            {isEdit ? 'Edit Affiliate' : 'Register Affiliate'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            {isEdit ? 'Update partner profile and commission structure.' : 'Configure a new partner profile and commission structure.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Section 1: Personal Details ─────────────────────────── */}
          <SectionCard
            icon={<User className="w-5 h-5" />}
            iconBg="var(--primary-fixed)"
            iconColor="var(--on-primary-fixed)"
            title="Personal Details"
            subtitle="Identification and contact information."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name" required error={errors.fullName?.message}>
                <StyledInput
                  {...register('fullName', { required: 'Full name is required' })}
                  placeholder="e.g. Alexander Pierce"
                  error={!!errors.fullName}
                />
              </Field>
              <Field label="Email Address" required error={errors.email?.message}>
                <StyledInput
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                  })}
                  type="email"
                  placeholder="alex@partnership.com"
                  error={!!errors.email}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Affiliate Type">
                <div className="relative">
                  <select
                    {...register('affiliateType')}
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
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 pointer-events-none" style={{ color: 'var(--on-surface-variant)' }} />
                </div>
              </Field>
              <Field label="Contact Number">
                <StyledInput
                  {...register('contactNumber')}
                  placeholder="+1 (555) 000-0000"
                />
              </Field>
            </div>

            <Field label="Physical Address">
              <Controller
                name="physicalAddress"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="Street, Suite, City, State, Zip"
                    className="w-full px-4 py-3 rounded-lg text-sm resize-none outline-none transition-all"
                    style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '2px solid transparent' }}
                    onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}
                    onBlur={e => { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
                  />
                )}
              />
            </Field>
          </SectionCard>

          {/* ── Section 2: Affiliate Details ────────────────────────── */}
          <SectionCard
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            }
            iconBg="#d1fae5"
            iconColor="#065f46"
            title="Affiliate Details"
            subtitle="Product linking and commercial terms."
          >
            {/* Product Selection */}
            <Field label="Product Selection">
              <div
                className="rounded-lg overflow-hidden"
                style={{ background: 'var(--surface-container-low)', border: '2px solid transparent' }}
              >
                <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(195,197,220,0.2)' }}>
                  <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--on-surface-variant)' }} />
                  <input
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search for products to link..."
                    className="flex-1 text-sm bg-transparent outline-none"
                    style={{ color: 'var(--on-surface)' }}
                  />
                </div>
                <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                  {filteredProducts.map(p => {
                    const isSelected = (selectedProductIds ?? []).includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors"
                        style={{
                          background: isSelected ? 'var(--primary-fixed)' : 'transparent',
                          color: isSelected ? 'var(--on-primary-fixed)' : 'var(--on-surface)',
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            background: isSelected ? 'var(--primary)' : 'transparent',
                            border: isSelected ? 'none' : '2px solid var(--outline)',
                          }}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="truncate flex-1">{p.name}</span>
                        <span className="text-xs opacity-60">${p.price}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              {(selectedProductIds?.length ?? 0) > 0 && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                  {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </Field>

            {/* Affiliate Code */}
            <Field label="Affiliate Code" required error={errors.affiliateCode?.message}>
              <div className="flex gap-2">
                <input
                  {...register('affiliateCode', { required: 'Affiliate code is required' })}
                  placeholder="EX-PARTNER-2024"
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-mono outline-none transition-all uppercase"
                  style={{
                    background: 'var(--surface-container-low)',
                    color: 'var(--on-surface)',
                    border: errors.affiliateCode ? '2px solid var(--error)' : '2px solid transparent',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.border = errors.affiliateCode ? '2px solid var(--error)' : '2px solid rgba(43,75,185,0.4)'
                    e.currentTarget.style.background = 'var(--surface-container-lowest)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.border = errors.affiliateCode ? '2px solid var(--error)' : '2px solid transparent'
                    e.currentTarget.style.background = 'var(--surface-container-low)'
                  }}
                  onChange={e => setValue('affiliateCode', e.target.value.toUpperCase(), { shouldValidate: true })}
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
            </Field>

            {/* Discount + Commission config cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onClick={() => setValue('discountType', t)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md transition-all"
                        style={
                          discountType === t
                            ? { background: 'var(--primary)', color: 'white' }
                            : { background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }
                        }
                      >
                        {t === 'fixed' ? 'FIXED' : '%'}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Discount Value" error={errors.discountValue?.message}>
                  <div className="relative">
                    {discountType === 'fixed' && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>$</span>
                    )}
                    <input
                      {...register('discountValue', {
                        required: 'Required',
                        min: { value: 0, message: 'Must be ≥ 0' },
                        ...(discountType === 'percentage' ? { max: { value: 100, message: 'Max 100%' } } : {}),
                      })}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full py-2.5 rounded-lg text-sm outline-none transition-all"
                      style={{
                        background: 'var(--surface-container-lowest)',
                        color: 'var(--on-surface)',
                        border: errors.discountValue ? '2px solid var(--error)' : '2px solid transparent',
                        paddingLeft: discountType === 'fixed' ? '1.75rem' : '0.875rem',
                        paddingRight: discountType === 'percentage' ? '1.75rem' : '0.875rem',
                      }}
                      onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)' }}
                      onBlur={e => { e.currentTarget.style.border = errors.discountValue ? '2px solid var(--error)' : '2px solid transparent' }}
                    />
                    {discountType === 'percentage' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>%</span>
                    )}
                  </div>
                </Field>
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
                        onClick={() => setValue('commissionType', t)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md transition-all"
                        style={
                          commissionType === t
                            ? { background: 'var(--primary)', color: 'white' }
                            : { background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }
                        }
                      >
                        {t === 'fixed' ? 'FIXED' : '%'}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label={commissionType === 'percentage' ? 'Commission Percentage' : 'Commission Value'} error={errors.commissionValue?.message}>
                  <div className="relative">
                    {commissionType === 'fixed' && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>$</span>
                    )}
                    <input
                      {...register('commissionValue', {
                        required: 'Required',
                        min: { value: 0, message: 'Must be ≥ 0' },
                        ...(commissionType === 'percentage' ? { max: { value: 100, message: 'Max 100%' } } : {}),
                      })}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full py-2.5 rounded-lg text-sm outline-none transition-all"
                      style={{
                        background: 'var(--surface-container-lowest)',
                        color: 'var(--on-surface)',
                        border: errors.commissionValue ? '2px solid var(--error)' : '2px solid transparent',
                        paddingLeft: commissionType === 'fixed' ? '1.75rem' : '0.875rem',
                        paddingRight: commissionType === 'percentage' ? '1.75rem' : '0.875rem',
                      }}
                      onFocus={e => { e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)' }}
                      onBlur={e => { e.currentTarget.style.border = errors.commissionValue ? '2px solid var(--error)' : '2px solid transparent' }}
                    />
                    {commissionType === 'percentage' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>%</span>
                    )}
                  </div>
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* ── Section 3: Bank Details ──────────────────────────────── */}
          <SectionCard
            icon={<Building2 className="w-5 h-5" />}
            iconBg="var(--warning-container, #fef3c7)"
            iconColor="var(--warning, #92400e)"
            title="Bank Details"
            subtitle="Payout information for commission settlements."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Bank Name">
                <StyledInput
                  {...register('bankName')}
                  placeholder="e.g. Global Trust Bank"
                />
              </Field>
              <Field label="Account Number">
                <StyledInput
                  {...register('accountNumber')}
                  placeholder="XXXX-XXXX-XXXX-0000"
                  className="font-mono"
                />
              </Field>
            </div>
          </SectionCard>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <button
              type="button"
              onClick={() => router.push('/dashboard/affiliates')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
            >
              {isEdit ? 'Review Changes' : 'Create Affiliate & Link'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
