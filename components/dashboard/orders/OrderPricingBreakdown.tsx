import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { cn } from '@/lib/utils'

interface OrderPricingBreakdownProps {
    subtotal: number
    taxAmount: number
    shippingAmount: number
    discountAmount: number
    totalAmount: number
    currency: string
}

export function OrderPricingBreakdown({
    subtotal,
    taxAmount,
    shippingAmount,
    discountAmount,
    totalAmount,
    currency,
}: OrderPricingBreakdownProps) {
    const fmt = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)

    const rows: { label: string; value: string; highlight?: boolean; discount?: boolean }[] = [
        { label: 'Subtotal', value: fmt(subtotal) },
    ]

    if (taxAmount > 0) rows.push({ label: 'Tax', value: fmt(taxAmount) })
    if (shippingAmount > 0) rows.push({ label: 'Shipping', value: fmt(shippingAmount) })
    if (discountAmount > 0)
        rows.push({ label: 'Discount', value: `-${fmt(discountAmount)}`, discount: true })

    return (
        <Card className="py-4">
            <CardHeader className="pb-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pricing
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {rows.map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className={cn(row.discount && 'text-emerald-600')}>
                            {row.value}
                        </span>
                    </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span>{fmt(totalAmount)}</span>
                </div>
            </CardContent>
        </Card>
    )
}
