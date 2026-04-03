import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending',
    awaiting_verification: 'Awaiting',
    verified: 'Verified',
    processing: 'Processing',
    shipped: 'Shipped',
    completed: 'Delivered',
    cancelled: 'Cancelled',
}

const STATUS_STYLE: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    pending: { variant: 'secondary', className: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200' },
    awaiting_verification: { variant: 'secondary', className: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
    verified: { variant: 'secondary', className: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200' },
    processing: { variant: 'secondary', className: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' },
    shipped: { variant: 'secondary', className: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
    completed: { variant: 'secondary', className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
    cancelled: { variant: 'destructive', className: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200' },
}

interface StatusPillProps {
    status: string
}

export function StatusPill({ status }: StatusPillProps) {
    const normStatus = status.toLowerCase()
    const style = STATUS_STYLE[normStatus] || STATUS_STYLE.pending
    const label = STATUS_LABEL[normStatus] || status

    return (
        <Badge variant={style.variant} className={cn('border', style.className)}>
            {label}
        </Badge>
    )
}
