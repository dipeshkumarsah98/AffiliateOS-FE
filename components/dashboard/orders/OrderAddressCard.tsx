import { MapPin } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { OrderAddress } from '@/lib/api/orders'

interface OrderAddressCardProps {
    label: string
    address: OrderAddress | null
}

export function OrderAddressCard({ label, address }: OrderAddressCardProps) {
    return (
        <Card className="py-4">
            <CardHeader className="pb-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {address ? (
                    <>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Street</span>
                            <span className="text-right font-medium">{address.street_address}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">City</span>
                            <span>{address.city || '—'}</span>
                        </div>
                        {address.state && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">State</span>
                                <span>{address.state}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Postal Code</span>
                            <span>{address.postal_code || '—'}</span>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">No address on file</p>
                )}
            </CardContent>
        </Card>
    )
}
