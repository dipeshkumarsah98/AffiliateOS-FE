import { useAuthStore } from '@/stores/auth-store'
import type { ProductListItem } from '@/lib/api/products'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { PackagePlus, Pencil } from 'lucide-react'
import {
    getProductImage,
    statusBadge,
} from '@/components/dashboard/products/helpers'
import { formatRelative } from 'date-fns'

type ProductDetailDialogProps = {
    product: ProductListItem | null
    onClose: () => void
    onAdjustStock: (productId: string) => void
}

export function ProductDetailDialog({
    product,
    onClose,
    onAdjustStock,
}: ProductDetailDialogProps) {
    const currentUser = useAuthStore((s) => s.currentUser)
    const isAdmin = currentUser?.roles.includes('admin')

    if (!product) return null

    const badge = statusBadge(product.status)

    return (
        <Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-5xl p-0 overflow-hidden" showCloseButton>
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-72 shrink-0 relative" style={{ background: '#111' }}>
                        <img
                            src={getProductImage(product)}
                            alt={product.title}
                            className="w-full h-full object-cover"
                            style={{ minHeight: '320px' }}
                        />
                    </div>

                    <div className="flex-1 p-7 flex flex-col">
                        <DialogHeader className="text-left mb-5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                    className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border-0"
                                    style={{ background: badge.bg, color: badge.text }}
                                >
                                    {badge.label}
                                </Badge>
                                <span className="text-xs" style={{ color: '#6b7280' }}>
                                    Slug: {product.slug}
                                </span>
                            </div>
                            <DialogTitle
                                className="text-2xl font-bold mt-2"
                                style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.02em', lineHeight: 1.25 }}
                            >
                                {product.title}
                            </DialogTitle>
                            <DialogDescription
                                className="text-xl font-bold"
                                style={{ color: '#2b4bb9', fontFamily: 'var(--font-display)' }}
                            >
                                {formatCurrency(product.price, "NPR")}
                            </DialogDescription>
                        </DialogHeader>

                        <p className="text-sm leading-relaxed mb-6" style={{ color: '#4b5563' }}>
                            {product.description}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="rounded-xl p-4" style={{ background: '#f8faff' }}>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6b7280' }}>
                                    Stock Level
                                </p>
                                <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#0f1623', letterSpacing: '-0.02em' }}>
                                    {product.totalStock === 0 ? '0 Units' : `${product.totalStock} Units`}
                                </p>
                            </div>
                            <div className="rounded-xl p-4" style={{ background: '#f8faff' }}>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6b7280' }}>
                                    Last Updated
                                </p>
                                <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#16a34a', letterSpacing: '-0.02em' }}>
                                    {formatRelative(new Date(product.updatedAt), new Date())}
                                </p>
                            </div>
                        </div>


                        {isAdmin ? (
                            <Button
                                type="button"
                                onClick={() => onAdjustStock(product.id)}
                                variant="outline"
                                className="px-5 py-3 rounded-xl text-sm font-semibold"
                                style={{ background: '#f0f4ff', color: '#2b4bb9', borderColor: '#c7d2fe' }}
                            >
                                <PackagePlus className="w-4 h-4" />
                                Adjust Stock
                            </Button>
                        ) : null}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
