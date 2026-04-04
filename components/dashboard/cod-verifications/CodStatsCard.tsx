import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CodStatsCardProps {
    label: string
    value: string | number
    icon: ReactNode
    trend?: { value: string; positive: boolean }
}

export function CodStatsCard({ label, value, icon, trend }: CodStatsCardProps) {
    return (
        <div
            className="rounded-xl p-5 transition-all"
            style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.04)' }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {icon}
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                        {label}
                    </p>
                </div>
                {trend && (
                    <span
                        className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-md",
                            trend.positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        )}
                    >
                        {trend.value}
                    </span>
                )}
            </div>
            <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: 'var(--on-surface)', letterSpacing: '-0.03em' }}
            >
                {value}
            </p>
        </div>
    )
}
