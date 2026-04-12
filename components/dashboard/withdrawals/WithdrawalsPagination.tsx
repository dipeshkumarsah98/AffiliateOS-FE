import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type WithdrawalsPaginationProps = {
    page: number
    totalPages: number
    total: number
    pageSize: number
    onChange: (p: number) => void
}

export function WithdrawalsPagination({
    page,
    totalPages,
    total,
    pageSize,
    onChange,
}: WithdrawalsPaginationProps) {
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1
    const to = Math.min(page * pageSize, total)

    const pages: (number | '...')[] = []
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i += 1) pages.push(i)
    } else {
        pages.push(1)
        if (page > 3) pages.push('...')
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i += 1) {
            pages.push(i)
        }
        if (page < totalPages - 2) pages.push('...')
        pages.push(totalPages)
    }

    return (
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #f0f2ff' }}>
            <span className="text-sm" style={{ color: '#6b7280' }}>
                Showing <strong style={{ color: '#0f1623' }}>{from}</strong> to{' '}
                <strong style={{ color: '#0f1623' }}>{to}</strong> of{' '}
                <strong style={{ color: '#0f1623' }}>{total}</strong> withdrawal requests
            </span>
            <div className="flex items-center gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onChange(page - 1)}
                    disabled={page === 1}
                    className="rounded-lg"
                    style={{ color: '#6b7280', background: '#f8faff' }}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                {pages.map((p, i) =>
                    p === '...' ? (
                        <span
                            key={`e${i}`}
                            className="w-8 h-8 flex items-center justify-center text-sm"
                            style={{ color: '#9ca3af' }}
                        >
                            ...
                        </span>
                    ) : (
                        <Button
                            type="button"
                            key={p}
                            onClick={() => onChange(p as number)}
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-lg text-sm font-medium"
                            style={
                                p === page
                                    ? { background: '#2b4bb9', color: '#fff' }
                                    : { background: '#f8faff', color: '#374151' }
                            }
                        >
                            {p}
                        </Button>
                    ),
                )}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onChange(page + 1)}
                    disabled={page === totalPages}
                    className="rounded-lg"
                    style={{ color: '#6b7280', background: '#f8faff' }}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
