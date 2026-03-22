'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Building2, ChevronRight, Pencil, ShieldCheck, Check,
  ArrowLeft, Info,
} from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { useApp } from '@/lib/store'
import { DUMMY_PRODUCTS } from '@/lib/dummy-data'
import { loadFormDraft, clearFormDraft } from '@/lib/affiliate-form-store'
import type { AffiliateFormData } from '@/lib/affiliate-form-store'

const TYPE_LABELS: Record<string, string> = {
  influencer: 'Influencer',
  creator: 'Creator',
  shop_owner: 'Shop Owner',
  blogger: 'Blogger',
  other: 'Other',
}

const TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  influencer: { bg: '#ede9fe', fg: '#5b21b6' },
  creator: { bg: '#dbeafe', fg: '#1d4ed8' },
  shop_owner: { bg: '#d1fae5', fg: '#065f46' },
  blogger: { bg: '#fef3c7', fg: '#92400e' },
  other: { bg: '#f1f5f9', fg: '#475569' },
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--on-surface-variant)' }}>{label}</p>
      <div className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{value}</div>
    </div>
  )
}

export default function ReviewAffiliatePage() {
  const { currentUser } = useApp()
  const router = useRouter()
  const [data, setData] = useState<AffiliateFormData | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (currentUser && !currentUser.roles.includes('admin')) {
      router.replace('/dashboard')
      return
    }
    const draft = loadFormDraft()
    if (!draft) {
      router.replace('/dashboard/affiliates/new')
      return
    }
    setData(draft)
  }, [currentUser, router])

  if (!data) return null

  const typeColors = TYPE_COLORS[data.affiliateType] ?? TYPE_COLORS.other
  const linkedProducts = DUMMY_PRODUCTS.filter(p => data.selectedProductIds?.includes(p.id))
  const isEdit = !!data.editId
  const maskedAccount = data.accountNumber
    ? `**** ${data.accountNumber.slice(-4)}`
    : '—'

  function handleConfirm() {
    setIsSaving(true)
    // In production this would call an API. For now simulate a short delay.
    setTimeout(() => {
      clearFormDraft()
      setConfirmed(true)
      setTimeout(() => router.push('/dashboard/affiliates'), 1800)
    }, 900)
  }

  function handleSaveDraft() {
    // Draft is already persisted in sessionStorage; just navigate away
    router.push('/dashboard/affiliates')
  }

  if (confirmed) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--surface)' }}>
        <Topbar title="Affiliates" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--tertiary-container)' }}
            >
              <Check className="w-10 h-10" style={{ color: 'var(--tertiary)' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              {isEdit ? 'Affiliate Updated!' : 'Affiliate Created!'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              {isEdit
                ? 'Changes have been saved successfully.'
                : `A welcome email with login credentials and their unique tracking link has been sent to ${data.email}.`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--surface)' }}>
      <Topbar title="Review & Confirm" />

      <main className="flex-1 p-6 lg:p-8 max-w-3xl mx-auto w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--on-surface-variant)' }}>
          <button type="button" onClick={() => router.push('/dashboard/affiliates')} className="hover:underline">
            Affiliates
          </button>
          <ChevronRight className="w-3 h-3" />
          <button type="button" onClick={() => router.back()} className="hover:underline">
            New Registration
          </button>
          <ChevronRight className="w-3 h-3" />
          <span style={{ color: 'var(--primary)' }}>Review &amp; Confirm</span>
        </div>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
            Review &amp; Confirm
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            Please verify all information before finalizing the new affiliate partner account.
          </p>
        </div>

        <div className="space-y-5">
          {/* Row 1: Personal + Bank side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

            {/* Personal Details (wider) */}
            <div className="md:col-span-3 rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 4px 24px rgba(19,27,46,0.04)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-fixed)' }}>
                    <User className="w-4 h-4" style={{ color: 'var(--on-primary-fixed)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Personal Details</p>
                    <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Contact and identity information</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-container-high)]"
                  style={{ color: 'var(--primary)' }}
                  title="Edit personal details"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ReviewRow label="Full Name" value={data.fullName} />
                <ReviewRow
                  label="Affiliate Type"
                  value={
                    <span
                      className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-0.5 uppercase tracking-wide"
                      style={{ background: typeColors.bg, color: typeColors.fg }}
                    >
                      {TYPE_LABELS[data.affiliateType]}
                    </span>
                  }
                />
                <ReviewRow label="Email Address" value={data.email} />
                <ReviewRow label="Contact Number" value={data.contactNumber || '—'} />
              </div>
              <ReviewRow label="Physical Address" value={data.physicalAddress || '—'} />
            </div>

            {/* Bank Details (narrower) */}
            <div className="md:col-span-2 rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 4px 24px rgba(19,27,46,0.04)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#fef3c7' }}>
                    <Building2 className="w-4 h-4" style={{ color: '#92400e' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Bank Details</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-container-high)]"
                  style={{ color: 'var(--primary)' }}
                  title="Edit bank details"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              <ReviewRow label="Bank Name" value={data.bankName || '—'} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--on-surface-variant)' }}>Account Number</p>
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg mt-1"
                  style={{ background: 'var(--surface-container-low)' }}
                >
                  <span className="text-sm font-mono font-semibold flex-1" style={{ color: 'var(--on-surface)' }}>
                    {maskedAccount}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--tertiary)' }} />
                </div>
                <p className="text-xs mt-1 italic" style={{ color: 'var(--on-surface-variant)' }}>Securely encrypted for safety</p>
              </div>
            </div>
          </div>

          {/* Affiliate Configuration */}
          <div className="rounded-2xl p-6 space-y-5" style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 4px 24px rgba(19,27,46,0.04)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#d1fae5' }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Affiliate Configuration</p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Product mapping and reward structure</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[var(--primary-fixed)]"
                style={{ color: 'var(--primary)', background: 'var(--surface-container-low)' }}
              >
                <Pencil className="w-3 h-3" />
                Change Config
              </button>
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--surface-container-low)' }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--on-surface-variant)' }}>Selected Product</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {linkedProducts.length > 0
                      ? linkedProducts.length === 1
                        ? linkedProducts[0].name
                        : `${linkedProducts.length} products`
                      : 'None selected'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--on-surface-variant)' }}>Affiliate Code</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold px-2 py-0.5 rounded" style={{ background: 'var(--primary-fixed)', color: 'var(--primary)' }}>
                      {data.affiliateCode}
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#d1fae5', color: '#065f46' }}
                    >
                      Auto-generated
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--on-surface-variant)' }}>Discount Model</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {data.discountType === 'percentage'
                      ? `${data.discountValue}% Off`
                      : `$${data.discountValue} Off`}
                    <span className="ml-1 text-xs font-normal" style={{ color: 'var(--on-surface-variant)' }}>
                      / {data.discountType === 'fixed' ? 'Fixed Rate' : 'Percentage'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--on-surface-variant)' }}>Commission Tier</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--tertiary)' }}>
                    {data.commissionType === 'percentage'
                      ? `${data.commissionValue}%`
                      : `$${data.commissionValue}`}
                    <span className="ml-1 text-xs font-normal" style={{ color: 'var(--on-surface-variant)' }}>
                      / {data.commissionType === 'fixed' ? 'Fixed' : 'Sale Percentage'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Edit Information
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-80"
                style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSaving}
                className="px-8 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                    </svg>
                    Confirming...
                  </>
                ) : (
                  isEdit ? 'Confirm & Update Affiliate' : 'Confirm & Create Affiliate'
                )}
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed)' }}
          >
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-70" />
            <p className="text-xs leading-relaxed">
              By clicking <strong>Confirm & Create Affiliate</strong>, you agree to the standard partnership terms and will automatically trigger a welcome email containing the unique tracking link and portal login credentials to <strong>{data.fullName}</strong>.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
