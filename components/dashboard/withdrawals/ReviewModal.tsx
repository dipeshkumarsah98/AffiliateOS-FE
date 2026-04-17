'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, X, XCircle, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    useAdminWithdrawalDetailQuery,
    useApproveWithdrawalMutation,
    useRejectWithdrawalMutation,
} from '@/hooks/use-admin-withdrawals'
import { toast } from 'sonner'
import { fileUpload } from '@/app/actions/fileUpload'

function StatusPill({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
    const map = {
        PENDING: { bg: '#fff8e6', color: '#b45309', dot: '#f59e0b', label: 'Pending' },
        APPROVED: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Approved' },
        REJECTED: { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444', label: 'Rejected' },
    }
    const s = map[status]
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: s.bg, color: s.color }}
        >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
            {s.label}
        </span>
    )
}

interface ReviewModalProps {
    withdrawalId: string
    onClose: () => void
}

export function ReviewModal({ withdrawalId, onClose }: ReviewModalProps) {
    const { data: item, isLoading, error } = useAdminWithdrawalDetailQuery(withdrawalId)

    const [decision, setDecision] = useState<'approved' | 'rejected' | ''>('')
    const [remarks, setRemarks] = useState('')
    const [screenshot, setScreenshot] = useState<string | undefined>()
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const approveMutation = useApproveWithdrawalMutation({
        onSuccess: () => {
            toast.success('Withdrawal approved successfully')
            onClose()
        },
        onError: (error) => {
            console.log('Approval error:', error)
            toast.error(error.message || 'Failed to approve withdrawal')
        },
    })

    const rejectMutation = useRejectWithdrawalMutation({
        onSuccess: () => {
            toast.success('Withdrawal rejected')
            onClose()
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to reject withdrawal')
        },
    })

    const isSubmitting = approveMutation.isPending || rejectMutation.isPending || isUploading

    // Show error toast and close modal if fetch fails
    useEffect(() => {
        if (error) {
            toast.error('Failed to load withdrawal details')
            onClose()
        }
    }, [error, onClose])

    // Initialize remarks from API data when it loads
    useEffect(() => {
        if (item) {
            setRemarks(item.remarks ?? '')
            setScreenshot(item.transactionProof ?? undefined)
        }
    }, [item])

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validImageTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload an image (JPEG, PNG, or WebP)')
            return
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            toast.error('File too large. Maximum size is 5MB')
            return
        }

        // Store the actual file object
        setSelectedFile(file)

        // Create preview
        const reader = new FileReader()
        reader.onload = (ev) => setScreenshot(ev.target?.result as string)
        reader.readAsDataURL(file)
    }

    async function handleSubmit() {
        if (!decision) return

        if (decision === 'approved') {
            // Validate that a transaction proof is uploaded
            if (!selectedFile && !item?.transactionProof) {
                toast.error('Please upload a transaction proof screenshot')
                return
            }

            let transactionProofUrl = item?.transactionProof || ''

            // Upload new file if selected
            if (selectedFile) {
                try {
                    setIsUploading(true)

                    // Create FormData and append the file
                    const formData = new FormData()
                    formData.append('file', selectedFile)

                    // Upload to R2
                    const result = await fileUpload(formData)

                    if (!result.ok || !result.stored?.url) {
                        toast.error(result.message || 'Failed to upload file')
                        return
                    }

                    transactionProofUrl = result.stored.url
                } catch (error) {
                    console.error('File upload error:', error)
                    toast.error('Failed to upload transaction proof. Please try again.')
                    return
                } finally {
                    setIsUploading(false)
                }
            }

            // Now submit the approval with the uploaded URL
            approveMutation.mutate({
                id: withdrawalId,
                payload: {
                    transactionProof: transactionProofUrl,
                    remarks: remarks.trim(),
                },
            })
        } else {
            // Reject mutation
            rejectMutation.mutate({
                id: withdrawalId,
                payload: {
                    rejectionReason: remarks.trim(),
                },
            })
        }
    }

    // Show loading spinner while fetching
    if (isLoading || !item) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(19,27,46,0.45)', backdropFilter: 'blur(12px)' }}
            >
                <div
                    className="w-full max-w-sm rounded-2xl p-10 text-center"
                    style={{ background: '#fff', boxShadow: '0 24px 60px rgba(19,27,46,0.18)' }}
                >
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: '#2b4bb9' }} />
                    <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                        Loading withdrawal details...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(19,27,46,0.45)', backdropFilter: 'blur(12px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full flex flex-col sm:flex-row overflow-hidden rounded-2xl"
                style={{
                    maxWidth: '800px',
                    background: '#fff',
                    boxShadow: '0 32px 80px rgba(19,27,46,0.18)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── LEFT: Withdrawal Details ── */}
                <div className="flex-1 p-6 sm:p-8 flex flex-col gap-6">
                    {/* Status + ID */}
                    <div>
                        <div className="mb-3">
                            <StatusPill status={item.status} />
                        </div>
                        <h2
                            className="text-2xl font-bold"
                            style={{
                                color: '#0f172a',
                                letterSpacing: '-0.03em',
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            Withdrawal #{item.id}
                        </h2>
                        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                            Requested on{' '}
                            {new Date(item.requestedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}{' '}
                            at{' '}
                            {new Date(item.requestedAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>

                    {/* Amount */}
                    <div
                        className="rounded-2xl p-5"
                        style={{ background: '#f8faff', border: '1px solid #eef2ff' }}
                    >
                        <p
                            className="text-xs font-bold uppercase tracking-widest mb-1"
                            style={{ color: '#9ca3af' }}
                        >
                            Requested Amount
                        </p>
                        <p
                            className="text-4xl font-bold"
                            style={{
                                color: '#0f172a',
                                letterSpacing: '-0.04em',
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            {item.currency} {item.amount.toFixed(2)}
                        </p>
                    </div>

                    {/* Vendor info */}
                    <div>
                        <p
                            className="text-xs font-bold uppercase tracking-widest mb-3"
                            style={{ color: '#9ca3af' }}
                        >
                            Vendor
                        </p>
                        <div className="flex items-center gap-3.5">
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                                style={{ background: '#eef2ff', color: '#2b4bb9' }}
                            >
                                {item.vendor.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                                    {item.vendor.name}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                                    {item.vendor.email}
                                </p>
                                {item.vendor.phone && (
                                    <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                                        {item.vendor.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bank details */}
                    <div>
                        <p
                            className="text-xs font-bold uppercase tracking-widest mb-3"
                            style={{ color: '#9ca3af' }}
                        >
                            Bank Details
                        </p>
                        <div className="space-y-2">
                            {[
                                ['Bank', item.vendor.extras?.bankName ?? '—'],
                                ['Account', item.vendor.extras?.accountNumber ?? '—'],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-between py-2"
                                    style={{ borderBottom: '1px solid #f4f5ff' }}
                                >
                                    <span className="text-xs" style={{ color: '#9ca3af' }}>
                                        {label}
                                    </span>
                                    <span className="text-sm font-medium" style={{ color: '#0f172a' }}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Action Panel ── */}
                <div
                    className="sm:w-72 flex-shrink-0 flex flex-col p-5 sm:p-7 gap-5"
                    style={{ background: '#fafbff', borderTop: '1px solid #f1f5f9' }}
                >
                    {/* Header row with close */}
                    <div className="flex items-center justify-between">
                        <p
                            className="text-xs font-bold uppercase tracking-widest"
                            style={{ color: '#9ca3af' }}
                        >
                            {item.status === 'PENDING' ? 'Review Decision' : 'Decision Record'}
                        </p>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#f1f5f9]"
                            style={{ color: '#6b7280' }}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* ── PENDING: show approve/reject form ── */}
                    {item.status === 'PENDING' && (
                        <>
                            {/* Decision buttons */}
                            <div>
                                <p
                                    className="text-xs font-bold uppercase tracking-widest mb-2.5"
                                    style={{ color: '#9ca3af' }}
                                >
                                    Decision
                                </p>
                                <div className="space-y-2.5">
                                    {(
                                        [
                                            {
                                                value: 'approved' as const,
                                                label: 'Approve payment',
                                                icon: Check,
                                                activeBg: '#f0fdf4',
                                                activeBorder: '#86efac',
                                                color: '#16a34a',
                                            },
                                            {
                                                value: 'rejected' as const,
                                                label: 'Reject request',
                                                icon: XCircle,
                                                activeBg: '#fef2f2',
                                                activeBorder: '#fca5a5',
                                                color: '#dc2626',
                                            },
                                        ] as const
                                    ).map((opt) => {
                                        const Icon = opt.icon
                                        const isSelected = decision === opt.value
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setDecision(opt.value)}
                                                className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                                                style={{
                                                    background: isSelected ? opt.activeBg : '#fff',
                                                    border: `1.5px solid ${isSelected ? opt.activeBorder : '#e2e8f0'}`,
                                                }}
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{
                                                        background: isSelected ? opt.color + '20' : '#f8faff',
                                                    }}
                                                >
                                                    <Icon
                                                        className="w-4 h-4"
                                                        style={{ color: isSelected ? opt.color : '#9ca3af' }}
                                                    />
                                                </div>
                                                <span
                                                    className="text-sm font-medium"
                                                    style={{ color: isSelected ? opt.color : '#374151' }}
                                                >
                                                    {opt.label}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Payment screenshot — only when approving */}
                            {decision === 'approved' && (
                                <div>
                                    <p
                                        className="text-xs font-bold uppercase tracking-widest mb-2"
                                        style={{ color: '#9ca3af' }}
                                    >
                                        Payment Screenshot
                                    </p>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFile}
                                    />
                                    {screenshot ? (
                                        <div
                                            className="relative rounded-xl overflow-hidden"
                                            style={{ border: '1.5px solid #e2e8f0' }}
                                        >
                                            <img
                                                src={screenshot}
                                                alt="Payment screenshot"
                                                className="w-full object-cover"
                                                style={{ maxHeight: '120px' }}
                                            />
                                            <button
                                                onClick={() => setScreenshot(undefined)}
                                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                                                style={{ background: 'rgba(0,0,0,0.5)' }}
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => fileRef.current?.click()}
                                            className="w-full flex flex-col items-center gap-2 py-5 rounded-xl transition-colors hover:bg-[#eef2ff]"
                                            style={{ background: '#f8faff', border: '1.5px dashed #c7d2fe' }}
                                        >
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                style={{ background: '#eef2ff' }}
                                            >
                                                <Upload className="w-4 h-4" style={{ color: '#2b4bb9' }} />
                                            </div>
                                            <span className="text-xs font-medium" style={{ color: '#6b7280' }}>
                                                Upload screenshot
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Admin note */}
                            <div>
                                <label
                                    className="block text-xs font-bold uppercase tracking-widest mb-2"
                                    style={{ color: '#9ca3af' }}
                                >
                                    Note {decision === 'rejected' ? '(required)' : '(optional)'}
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder={
                                        decision === 'rejected'
                                            ? 'Reason for rejection...'
                                            : 'Add a note for the vendor...'
                                    }
                                    rows={3}
                                    className="w-full px-3.5 py-3 rounded-xl text-sm resize-none outline-none transition-all"
                                    style={{
                                        background: '#fff',
                                        color: '#0f172a',
                                        border: '1.5px solid #e2e8f0',
                                    }}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = '#2b4bb9')}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                                />
                            </div>

                            {/* Submit */}
                            <div
                                className="mt-auto space-y-2.5 pt-2"
                                style={{ borderTop: '1px solid #f1f5f9' }}
                            >
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!decision || (decision === 'rejected' && !remarks.trim()) || isSubmitting}
                                    className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    style={{
                                        background:
                                            decision === 'approved'
                                                ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
                                                : decision === 'rejected'
                                                    ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                                                    : 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)',
                                    }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {decision === 'approved' ? 'Approving...' : 'Rejecting...'}
                                        </>
                                    ) : decision === 'approved' ? (
                                        <>
                                            <Check className="w-4 h-4" /> Approve & Mark Paid
                                        </>
                                    ) : decision === 'rejected' ? (
                                        <>
                                            <XCircle className="w-4 h-4" /> Reject Request
                                        </>
                                    ) : (
                                        'Select a Decision'
                                    )}
                                </Button>
                                <Button
                                    onClick={onClose}
                                    variant="ghost"
                                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f1f5f9]"
                                    style={{ background: '#f8faff', color: '#6b7280' }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}

                    {/* ── APPROVED: show screenshot + note (read-only) ── */}
                    {item.status === 'APPROVED' && (
                        <>
                            <div
                                className="flex items-center gap-2 px-3.5 py-3 rounded-xl"
                                style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}
                            >
                                <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} />
                                <span className="text-sm font-semibold" style={{ color: '#15803d' }}>
                                    Payment Approved
                                </span>
                            </div>

                            {item.processedAt && (
                                <p className="text-xs" style={{ color: '#9ca3af' }}>
                                    Processed on{' '}
                                    {new Date(item.processedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </p>
                            )}

                            {item.transactionProof && (
                                <div>
                                    <p
                                        className="text-xs font-bold uppercase tracking-widest mb-2"
                                        style={{ color: '#9ca3af' }}
                                    >
                                        Payment Screenshot
                                    </p>
                                    <img
                                        src={item.transactionProof}
                                        alt="Payment screenshot"
                                        className="w-full rounded-xl object-cover"
                                        style={{ border: '1px solid #f1f5f9', maxHeight: '160px' }}
                                    />
                                </div>
                            )}

                            {item.remarks && (
                                <div>
                                    <p
                                        className="text-xs font-bold uppercase tracking-widest mb-2"
                                        style={{ color: '#9ca3af' }}
                                    >
                                        Admin Note
                                    </p>
                                    <p
                                        className="text-sm leading-relaxed px-3.5 py-3 rounded-xl"
                                        style={{
                                            background: '#fff',
                                            color: '#374151',
                                            border: '1.5px solid #e2e8f0',
                                        }}
                                    >
                                        {item.remarks}
                                    </p>
                                </div>
                            )}

                            <div
                                className="mt-auto pt-2"
                                style={{ borderTop: '1px solid #f1f5f9' }}
                            >
                                <Button
                                    onClick={onClose}
                                    variant="ghost"
                                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f1f5f9]"
                                    style={{ background: '#f8faff', color: '#6b7280' }}
                                >
                                    Close
                                </Button>
                            </div>
                        </>
                    )}

                    {/* ── REJECTED: show note only (read-only) ── */}
                    {item.status === 'REJECTED' && (
                        <>
                            <div
                                className="flex items-center gap-2 px-3.5 py-3 rounded-xl"
                                style={{ background: '#fef2f2', border: '1.5px solid #fca5a5' }}
                            >
                                <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#dc2626' }} />
                                <span className="text-sm font-semibold" style={{ color: '#b91c1c' }}>
                                    Request Rejected
                                </span>
                            </div>

                            {item.processedAt && (
                                <p className="text-xs" style={{ color: '#9ca3af' }}>
                                    Processed on{' '}
                                    {new Date(item.processedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </p>
                            )}

                            {(item.rejectionReason || item.remarks) ? (
                                <div>
                                    <p
                                        className="text-xs font-bold uppercase tracking-widest mb-2"
                                        style={{ color: '#9ca3af' }}
                                    >
                                        Rejection Reason
                                    </p>
                                    <p
                                        className="text-sm leading-relaxed px-3.5 py-3 rounded-xl"
                                        style={{
                                            background: '#fff',
                                            color: '#374151',
                                            border: '1.5px solid #e2e8f0',
                                        }}
                                    >
                                        {item.rejectionReason || item.remarks}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm" style={{ color: '#9ca3af' }}>
                                    No reason was recorded.
                                </p>
                            )}

                            <div
                                className="mt-auto pt-2"
                                style={{ borderTop: '1px solid #f1f5f9' }}
                            >
                                <Button
                                    onClick={onClose}
                                    variant="ghost"
                                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f1f5f9]"
                                    style={{ background: '#f8faff', color: '#6b7280' }}
                                >
                                    Close
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
