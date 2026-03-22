import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-[var(--warning-container)] text-[var(--on-warning-container)]',
  },
  awaiting_verification: {
    label: 'Awaiting Verification',
    className: 'bg-[var(--primary-fixed)] text-[var(--on-primary-fixed)]',
  },
  processing: {
    label: 'Processing',
    className: 'bg-[var(--secondary-container)] text-[var(--on-secondary-container)]',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-blue-100 text-blue-700',
  },
  completed: {
    label: 'Completed',
    className: 'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-[var(--error-container)] text-[var(--on-error-container)]',
  },
}

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
