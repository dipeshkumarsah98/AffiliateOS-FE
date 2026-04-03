'use client'

import { useRouter } from 'next/navigation'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, Link2, ExternalLink, User, CreditCard, Loader2 } from 'lucide-react'

import type { OrderListItem } from '@/lib/api/orders'
import { useOrderDetailQuery } from '@/hooks/use-orders'

import { StatusPill } from './StatusPill'
import { OrderTimeline } from './OrderTimeline'
import { formatRelative } from 'date-fns'

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 2,
    }).format(amount)
}

interface OrderDetailModalProps {
    order: OrderListItem | null
    onClose: () => void
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
    const router = useRouter()
    const { data: detail, isLoading } = useOrderDetailQuery(order?.id ?? '')

    if (!order) return null

    const currency = detail?.currency ?? order.currency ?? 'USD'

    return (
        <Dialog open={!!order} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-5xl p-0 gap-0 overflow-hidden">
                <VisuallyHidden>
                    <DialogTitle>Order #{order.orderNumber}</DialogTitle>
                </VisuallyHidden>
                <div className="flex max-h-[88vh]">
                    <div className="flex-1 p-7 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <StatusPill status={detail?.status ?? order.status} />
                            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                        </div>

                        <h2 className="text-2xl font-bold mb-1 tracking-tight">
                            Order #{order.orderNumber}
                        </h2>
                        <p className="text-sm mb-6 text-muted-foreground">
                            Placed on {" "}
                            {formatRelative(new Date(order.createdAt), new Date())}
                        </p>

                        {/* Customer + Payment row */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* Customer */}
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground mb-0.5">Customer</p>
                                    {detail ? (
                                        <>
                                            <p className="text-sm font-semibold truncate">{detail.user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{detail.user.email}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-semibold truncate">{order.user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{order.user.email}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground mb-0.5">Payment</p>
                                    {detail?.payment ? (
                                        <>
                                            <p className="text-sm font-semibold capitalize">{detail.payment.paymentMethod.replace(/_/g, ' ')}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <StatusPill status={detail.payment.status} />
                                                <span className="text-xs text-muted-foreground">
                                                    {formatCurrency(detail.payment.amount, detail.payment.currency)}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-semibold capitalize">{order.paymentMethod.replace(/_/g, ' ')}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <StatusPill status={order.payment?.status ?? 'pending'} />
                                                <span className="text-xs text-muted-foreground">
                                                    {formatCurrency(order.payment?.amount ?? order.totalAmount, currency)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Items Summary */}
                        <div className="mb-6">
                            <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-muted-foreground">
                                Items ({(detail?.items ?? order.items).length})
                            </p>
                            <div className="space-y-3">
                                {(detail?.items ?? order.items).map(item => (
                                    <div key={item.productId} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg shrink-0 bg-muted flex items-center justify-center">
                                            <Package className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{item.product.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.quantity} × {formatCurrency(item.unitPrice, currency)}
                                            </p>
                                        </div>
                                        <span className="text-sm font-bold shrink-0">
                                            {formatCurrency(item.totalPrice, currency)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="mt-4 pt-4 space-y-1.5 border-t">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(detail?.subtotal ?? order.subtotal, currency)}</span>
                                </div>
                                {(detail?.taxAmount ?? order.taxAmount) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>{formatCurrency(detail?.taxAmount ?? order.taxAmount, currency)}</span>
                                    </div>
                                )}
                                {(detail?.shippingAmount ?? order.shippingAmount) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span>{formatCurrency(detail?.shippingAmount ?? order.shippingAmount, currency)}</span>
                                    </div>
                                )}
                                {(detail?.discountAmount ?? order.discountAmount) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Discount</span>
                                        <span className="text-green-600">
                                            -{formatCurrency(detail?.discountAmount ?? order.discountAmount, currency)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-bold pt-1">
                                    <span>Total</span>
                                    <span>{formatCurrency(detail?.totalAmount ?? order.totalAmount, currency)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address + Affiliate */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Shipping Address */}
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                                    Shipping Address
                                </p>
                                {detail?.shippingAddress ? (
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Street</span>
                                            <span className="font-medium text-right">{detail.shippingAddress.street_address}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">City</span>
                                            <span>{detail.shippingAddress.city}</span>
                                        </div>
                                        {detail.shippingAddress.state && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">State</span>
                                                <span>{detail.shippingAddress.state}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Postal Code</span>
                                            <span>{detail.shippingAddress.postal_code}</span>
                                        </div>
                                    </div>
                                ) : isLoading ? (
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-36" />
                                        <Skeleton className="h-4 w-28" />
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">—</p>
                                )}
                            </div>

                            {/* Affiliate */}
                            {detail?.affiliate ? (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                                        Affiliate
                                    </p>
                                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <Link2 className="w-3.5 h-3.5 text-primary" />
                                            <span className="text-sm font-semibold text-primary">{detail.affiliate.fullName}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Code: {detail.affiliate.affiliateCode}
                                        </p>
                                        {detail.earnings.length > 0 && (
                                            <p className="text-xs font-medium text-emerald-600 mt-1">
                                                Earned: {formatCurrency(detail.earnings.reduce((s, e) => s + e.amount, 0), currency)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : order.affiliateId && isLoading ? (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                                        Affiliate
                                    </p>
                                    <Skeleton className="h-16 w-full rounded-lg" />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* ── RIGHT PANEL ── */}
                    <div className="w-72 shrink-0 flex flex-col p-7 bg-muted/30 border-l">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Order Journey
                            </p>
                        </div>

                        {/* Timeline */}
                        <div className="flex-1">
                            <OrderTimeline
                                currentStatus={detail?.status ?? order.status}
                                createdAt={order.createdAt}
                                statuses={detail?.statuses}
                            />
                        </div>

                        {/* Notes */}
                        {detail?.notes && (
                            <div className="mb-4 p-3 rounded-lg bg-muted/60 border">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                                <p className="text-xs leading-relaxed">{detail.notes}</p>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-auto space-y-2.5 pt-4 border-t">
                            <Button variant="outline" className="w-full">
                                Print Invoice
                            </Button>
                            <Button
                                className="w-full"
                                onClick={() => {
                                    onClose()
                                    router.push(`/dashboard/orders/${order.id}`)
                                }}
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Full Details
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
