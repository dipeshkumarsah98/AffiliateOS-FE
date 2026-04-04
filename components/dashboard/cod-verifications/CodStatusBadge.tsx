import { Clock, CheckCircle2, Ban } from 'lucide-react'

interface CodStatusBadgeProps {
    status: 'pending' | 'confirmed' | 'rejected'
}

export function CodStatusBadge({ status }: CodStatusBadgeProps) {
    const config = {
        pending: {
            bg: 'var(--warning-container)',
            color: 'var(--on-warning-container)',
            label: 'Pending',
            icon: Clock
        },
        confirmed: {
            bg: '#f0fdf4',
            color: '#166534',
            label: 'Confirmed',
            icon: CheckCircle2
        },
        rejected: {
            bg: '#fef2f2',
            color: '#b91c1c',
            label: 'Rejected',
            icon: Ban
        },
    }

    const c = config[status]
    const Icon = c.icon

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{ background: c.bg, color: c.color }}
        >
            <Icon className="w-3 h-3 shrink-0" />
            {c.label}
        </span>
    )
}
