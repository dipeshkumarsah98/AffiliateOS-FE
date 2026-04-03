import { Package } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { OrderDetailItem } from '@/lib/api/orders'

interface OrderItemsTableProps {
    items: OrderDetailItem[]
    currency: string
}

export function OrderItemsTable({ items, currency }: OrderItemsTableProps) {
    const fmt = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)

    return (
        <Card className="py-4">
            <CardHeader className="pb-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Items ({items.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="divide-y">
                    {items.map((item) => {
                        const img = item.product.images?.[0]
                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                            >
                                {img ? (
                                    <img
                                        src={img}
                                        alt={item.product.title}
                                        className="w-14 h-14 rounded-lg object-cover shrink-0 bg-muted"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-lg shrink-0 bg-muted flex items-center justify-center">
                                        <Package className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">
                                        {item.product.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {fmt(item.unitPrice)} x {item.quantity}
                                    </p>
                                </div>
                                <span className="text-sm font-bold shrink-0 tabular-nums">
                                    {fmt(item.totalPrice)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
