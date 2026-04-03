import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
    label: string
    value: string
    sub?: string
    icon?: React.ReactNode
    accent?: boolean
}

export function StatCard({ label, value, sub, icon, accent = false }: StatCardProps) {
    return (
        <Card className={accent ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10' : ''}>
            <CardContent className="flex items-center gap-4 px-6 py-5">
                {icon && <div className="shrink-0">{icon}</div>}
                <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5 text-muted-foreground">
                        {label}
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                        {value}
                    </p>
                    {sub && (
                        <p className="text-xs mt-1 font-medium text-muted-foreground">{sub}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
