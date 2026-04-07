import { User } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrderAddress } from '@/lib/api/orders'

interface OrderCustomerCardProps {
    name: string
    email: string
    shippingAddress: OrderAddress | null
}

export function OrderCustomerCard({ name, email, shippingAddress }: OrderCustomerCardProps) {
    return (
        <Card className="py-4">
            <CardHeader className="pb-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Customer
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
                {shippingAddress && (
                    <div className="pt-2">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Shipping Address</p>
                        <p className="text-sm leading-relaxed">{shippingAddress.street_address}, {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
