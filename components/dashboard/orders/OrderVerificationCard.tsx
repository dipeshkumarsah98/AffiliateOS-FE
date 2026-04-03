import { ShieldCheck } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { cn } from '@/lib/utils'

import type { OrderVerification } from '@/lib/api/orders'
import { formatRelative } from 'date-fns'

const VERIFICATION_STYLE: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

interface OrderVerificationCardProps {
    verification: OrderVerification
}

export function OrderVerificationCard({ verification }: OrderVerificationCardProps) {
    const statusKey = verification.verificationStatus.toLowerCase()
    const statusStyle = VERIFICATION_STYLE[statusKey] ?? VERIFICATION_STYLE.pending

    return (
        <Card className="py-4">
            <CardHeader className="pb-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verification
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="secondary" className={cn('border', statusStyle)}>
                        {verification.verificationStatus}
                    </Badge>
                </div>
                {verification.customerResponse && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Response</span>
                        <span className="text-sm font-medium capitalize">
                            {verification.customerResponse}
                        </span>
                    </div>
                )}
                {verification.remarks && (
                    <div>
                        <span className="text-sm text-muted-foreground">Remarks</span>
                        <p className="text-sm mt-0.5">{verification.remarks}</p>
                    </div>
                )}
                {verification.verifiedAt && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Verified</span>
                        <span className="text-sm">
                            {formatRelative(new Date(verification.verifiedAt), new Date())}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
