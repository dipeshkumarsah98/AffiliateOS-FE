'use client'

import type { AffiliateListItem } from '@/lib/api/affiliates'
import type { AffiliateType } from '@/lib/types'
import { X, Mail, Package, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

interface ViewAffiliateModalProps {
    affiliate: AffiliateListItem
    onEdit: () => void
    onClose: () => void
}

export function ViewAffiliateModal({ affiliate, onEdit, onClose }: ViewAffiliateModalProps) {
    const vendorName = affiliate.vendor.name
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
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full max-w-3xl rounded-2xl overflow-hidden animate-fade-in-up flex flex-col sm:flex-row"
                style={{
                    background: '#fff',
                    boxShadow: '0 32px 80px rgba(19,27,46,0.18)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── LEFT PANEL: Profile & Details ── */}
                <div className="flex-1 p-5 sm:p-8 flex flex-col gap-6">
                    {/* Status + name */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                                style={
                                    isActive
                                        ? { background: '#f0fdf4', color: '#15803d' }
                                        : { background: '#f4f5ff', color: '#6b7280' }
                                }
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: isActive ? '#22c55e' : '#9ca3af' }}
                                />
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
                                <h2
                                    className="text-2xl font-bold"
                                    style={{
                                        color: '#0f172a',
                                        letterSpacing: '-0.03em',
                                        fontFamily: 'var(--font-display)',
                                    }}
                                >
                                    {vendorName}
                                </h2>
                                <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
                                    Joined{' '}
                                    {new Date(affiliate.createdAt).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact info */}
                    <div>
                        <p
                            className="text-xs font-bold uppercase tracking-widest mb-3"
                            style={{ color: '#9ca3af' }}
                        >
                            Contact Information
                        </p>
                        <div className="space-y-2.5">
                            <div className="flex items-start gap-3">
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                    style={{ background: '#f8faff' }}
                                >
                                    <Mail className="w-3.5 h-3.5" style={{ color: '#6b7280' }} />
                                </div>
                                <div>
                                    <p className="text-xs" style={{ color: '#9ca3af' }}>
                                        Email
                                    </p>
                                    <p className="text-sm font-medium mt-0.5" style={{ color: '#0f172a' }}>
                                        {vendorEmail}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {affiliate.product && (
                        <div>
                            <p
                                className="text-xs font-bold uppercase tracking-widest mb-3"
                                style={{ color: '#9ca3af' }}
                            >
                                Linked Product
                            </p>
                            <div
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                style={{ background: '#f8faff' }}
                            >
                                <div
                                    className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
                                    style={{ background: '#eef2ff' }}
                                >
                                    <Package className="w-4 h-4 m-auto mt-2" style={{ color: '#2b4bb9' }} />
                                </div>
                                <span
                                    className="text-sm flex-1 font-medium truncate"
                                    style={{ color: '#0f172a' }}
                                >
                                    {affiliate.product.title}
                                </span>
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
                        <p
                            className="text-xs font-bold uppercase tracking-widest"
                            style={{ color: '#9ca3af' }}
                        >
                            Partner Summary
                        </p>
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
                        <p
                            className="text-xs uppercase tracking-widest mb-1.5"
                            style={{ color: '#2b4bb9', opacity: 0.7 }}
                        >
                            Affiliate Code
                        </p>
                        <p
                            className="text-lg font-bold font-mono"
                            style={{ color: '#2b4bb9', letterSpacing: '0.04em' }}
                        >
                            {affiliate.code}
                        </p>
                    </div>

                    {/* Discount tile */}
                    <div
                        className="rounded-xl p-4"
                        style={{ background: '#fff', border: '1px solid #f1f5f9' }}
                    >
                        <p
                            className="text-xs uppercase tracking-widest mb-1"
                            style={{ color: '#9ca3af' }}
                        >
                            Discount
                        </p>
                        <p
                            className="text-2xl font-bold"
                            style={{
                                color: '#0f172a',
                                letterSpacing: '-0.03em',
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            {affiliate.discountType === 'PERCENTAGE'
                                ? `${affiliate.discountValue}%`
                                : `$${affiliate.discountValue}`}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                            {affiliate.discountType === 'PERCENTAGE'
                                ? 'Percentage off order'
                                : 'Fixed amount off'}
                        </p>
                    </div>

                    {/* Commission tile */}
                    <div
                        className="rounded-xl p-4"
                        style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                    >
                        <p
                            className="text-xs uppercase tracking-widest mb-1"
                            style={{ color: '#15803d', opacity: 0.7 }}
                        >
                            Commission
                        </p>
                        <p
                            className="text-2xl font-bold"
                            style={{
                                color: '#15803d',
                                letterSpacing: '-0.03em',
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            {affiliate.commissionType === 'PERCENTAGE'
                                ? `${affiliate.commissionValue}%`
                                : `$${affiliate.commissionValue}`}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#15803d', opacity: 0.7 }}>
                            {affiliate.commissionType === 'PERCENTAGE' ? 'Per sale' : 'Fixed per sale'}
                        </p>
                    </div>

                    {/* Bank info */}
                    <div
                        className="rounded-xl p-4"
                        style={{ background: '#fff', border: '1px solid #f1f5f9' }}
                    >
                        <p
                            className="text-xs uppercase tracking-widest mb-2"
                            style={{ color: '#9ca3af' }}
                        >
                            Bank Details
                        </p>
                        <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                            {bankName}
                        </p>
                        <p className="text-xs font-mono mt-1" style={{ color: '#6b7280' }}>
                            {accountNumber}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto space-y-2.5 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                        <Button
                            onClick={onEdit}
                            className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit Affiliate
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f1f5f9]"
                            style={{ background: '#f8faff', color: '#6b7280' }}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
