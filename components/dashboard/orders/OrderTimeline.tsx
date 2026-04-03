'use client'

import {
    CheckCircle2,
    Clock,
    Package,
    ShieldCheck,
    Truck,
    XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import type { OrderStatusEntry } from '@/lib/api/orders'
import { formatRelative } from 'date-fns'

const ORDERED_STATUSES = [
    'PENDING',
    'AWAITING_VERIFICATION',
    'VERIFIED',
    'PROCESSING',
    'SHIPPED',
    'COMPLETED',
]

const STATUS_META: Record<string, { label: string; icon: React.ElementType }> = {
    PENDING: { label: 'Order Placed', icon: Clock },
    AWAITING_VERIFICATION: { label: 'Awaiting Verification', icon: ShieldCheck },
    VERIFIED: { label: 'Verified', icon: CheckCircle2 },
    PROCESSING: { label: 'Processing', icon: Package },
    SHIPPED: { label: 'Shipped', icon: Truck },
    COMPLETED: { label: 'Delivered', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelled', icon: XCircle },
}

function buildSyntheticStatuses(
    currentStatus: string,
    createdAt: string,
): OrderStatusEntry[] {
    const upper = currentStatus.toUpperCase()

    if (upper === 'CANCELLED') {
        return [
            { status: 'PENDING', createdAt, createdBy: null },
            { status: 'CANCELLED', createdAt, createdBy: null },
        ]
    }

    const entries: OrderStatusEntry[] = []
    for (const s of ORDERED_STATUSES) {
        entries.push({ status: s, createdAt, createdBy: null })
        if (s === upper) break
    }
    return entries
}

interface OrderTimelineProps {
    currentStatus: string
    createdAt: string
    statuses?: OrderStatusEntry[]
}

export function OrderTimeline({
    currentStatus,
    createdAt,
    statuses,
}: OrderTimelineProps) {
    const isCancelled = currentStatus.toUpperCase() === 'CANCELLED'
    const resolvedStatuses = statuses ?? buildSyntheticStatuses(currentStatus, createdAt)

    const completedSet = new Set(resolvedStatuses.map((s) => s.status.toUpperCase()))

    const timelineSteps = isCancelled
        ? resolvedStatuses
        : ORDERED_STATUSES.map((s) => ({
            status: s,
            createdAt: resolvedStatuses.find((e) => e.status.toUpperCase() === s)?.createdAt ?? '',
            createdBy: resolvedStatuses.find((e) => e.status.toUpperCase() === s)?.createdBy ?? null,
        }))

    return (
        <div className="space-y-0">
            {timelineSteps.map((step, idx) => {
                const upper = step.status.toUpperCase()
                const meta = STATUS_META[upper] ?? { label: step.status, icon: Clock }
                const Icon = meta.icon
                const isDone = completedSet.has(upper)
                const isActive = upper === currentStatus.toUpperCase()
                const isCancelledStep = upper === 'CANCELLED'
                const isLast = idx === timelineSteps.length - 1

                return (
                    <div key={upper} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors',
                                    isCancelledStep
                                        ? 'bg-destructive'
                                        : isDone
                                            ? isActive
                                                ? 'bg-primary shadow-md shadow-primary/25'
                                                : 'bg-emerald-600'
                                            : 'bg-muted border-2 border-border',
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'w-3.5 h-3.5',
                                        isCancelledStep || isDone
                                            ? 'text-white'
                                            : 'text-muted-foreground',
                                    )}
                                />
                            </div>
                            {!isLast && (
                                <div
                                    className={cn(
                                        'w-0.5 flex-1 my-1 min-h-6',
                                        isCancelledStep
                                            ? 'bg-destructive/30'
                                            : isDone && !isActive
                                                ? 'bg-emerald-600'
                                                : 'bg-border',
                                    )}
                                />
                            )}
                        </div>
                        <div className="pb-5 pt-0.5">
                            <p
                                className={cn(
                                    'text-sm font-medium',
                                    isCancelledStep
                                        ? 'text-destructive'
                                        : isDone
                                            ? 'text-foreground'
                                            : 'text-muted-foreground',
                                )}
                            >
                                {meta.label}
                            </p>
                            {isDone && step.createdAt ? (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatRelative(new Date(step.createdAt), new Date())}
                                </p>
                            ) : (
                                !isDone &&
                                !isCancelledStep && (
                                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                                        Pending
                                    </p>
                                )
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
