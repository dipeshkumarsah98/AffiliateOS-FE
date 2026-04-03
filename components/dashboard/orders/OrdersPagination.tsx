import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface OrdersPaginationProps {
    page: number
    totalPages: number
    total: number
    pageSize: number
    onChange: (page: number) => void
}

export function OrdersPagination({ page, totalPages, total, pageSize, onChange }: OrdersPaginationProps) {
    const pages: (number | '...')[] = []

    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
        pages.push(1)
        if (page > 3) pages.push('...')
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
        if (page < totalPages - 2) pages.push('...')
        pages.push(totalPages)
    }

    return (
        <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
                Showing <strong className="text-foreground">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}</strong> of{' '}
                <strong className="text-foreground">{total}</strong> orders
            </p>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onChange(page - 1)}
                    disabled={page === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                {pages.map((p, i) =>
                    p === '...' ? (
                        <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-sm text-muted-foreground">
                            …
                        </span>
                    ) : (
                        <Button
                            key={p}
                            variant={page === p ? 'default' : 'outline'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onChange(p as number)}
                        >
                            {p}
                        </Button>
                    )
                )}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onChange(page + 1)}
                    disabled={page === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
