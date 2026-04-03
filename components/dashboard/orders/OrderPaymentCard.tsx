import { CreditCard } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusPill } from './StatusPill'

import type { OrderPayment } from '@/lib/api/orders'

interface OrderPaymentCardProps {
    payment: OrderPayment | null
    paymentMethod: string
    currency: string
}

export function OrderPaymentCard({ payment, paymentMethod, currency }: OrderPaymentCardProps) {
    const formatAmount = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)

    return (
        <Card className="py-4">
            <CardHeader className="pb-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    Payment
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Method</span>
                    <span className="text-sm font-medium">{paymentMethod}</span>
                </div>
                {payment && (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Provider</span>
                            <span className="text-sm font-medium">{payment.provider}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Amount</span>
                            <span className="text-sm font-semibold">{formatAmount(payment.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <StatusPill status={payment.status} />
                        </div>
                        {payment.transactionId && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Txn ID</span>
                                <span className="font-mono text-xs">{payment.transactionId}</span>
                            </div>
                        )}
                        {payment.paidAt && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Paid</span>
                                <span className="text-sm">
                                    {new Date(payment.paidAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
