import { getApiErrorMessage } from '@/lib/api/client'
import type { ProductListItem } from '@/lib/api/products'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { TableSkeletonRow } from '@/components/dashboard/TableSkeletonRow'
import { ProductRow } from '@/components/dashboard/products/ProductRow'
import { AlertTriangle, Package, RefreshCw } from 'lucide-react'

type ProductsTableBodyProps = {
    isLoading: boolean
    isError: boolean
    error: unknown
    products: ProductListItem[]
    deferredSearch: string
    pageSize: number
    onRetry: () => void
    onView: (product: ProductListItem) => void
    onEdit: (product: ProductListItem) => void
    onStock: (product: ProductListItem) => void
}

const SKELETON_CELL_WIDTHS = [60, 220, 90, 130, 90, 160]

type TableState = 'loading' | 'error' | 'empty' | 'data'

function resolveTableState(
    isLoading: boolean,
    isError: boolean,
    productsLength: number,
): TableState {
    if (isLoading) return 'loading'
    if (isError) return 'error'
    if (productsLength === 0) return 'empty'
    return 'data'
}

export function ProductsTableBody({
    isLoading,
    isError,
    error,
    products,
    deferredSearch,
    pageSize,
    onRetry,
    onView,
    onEdit,
    onStock,
}: ProductsTableBodyProps) {
    const state = resolveTableState(isLoading, isError, products.length)

    if (state === 'loading') {
        return Array.from({ length: pageSize }).map((_, i) => (
            <TableSkeletonRow key={`loading-${i}`} cellWidths={SKELETON_CELL_WIDTHS} />
        ))
    }

    if (state === 'error') {
        return (
            <TableRow>
                <TableCell colSpan={6} className="py-16 text-center px-6">
                    <AlertTriangle
                        className="w-10 h-10 mx-auto mb-3 opacity-40"
                        style={{ color: '#dc2626' }}
                    />
                    <p className="text-sm font-semibold mb-1" style={{ color: '#0f1623' }}>
                        Unable to load products
                    </p>
                    <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
                        {getApiErrorMessage(error, 'Product list request failed.')}
                    </p>
                    <Button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                        style={{ background: '#eef2ff', color: '#2b4bb9' }}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </Button>
                </TableCell>
            </TableRow>
        )
    }

    if (state === 'empty') {
        return (
            <TableRow>
                <TableCell colSpan={6} className="py-20 text-center">
                    <Package
                        className="w-10 h-10 mx-auto mb-3 opacity-20"
                        style={{ color: '#9ca3af' }}
                    />
                    <p className="text-sm" style={{ color: '#9ca3af' }}>
                        {deferredSearch ? 'No products match your search' : 'No products found'}
                    </p>
                </TableCell>
            </TableRow>
        )
    }

    return (
        <>
            {products.map((product) => (
                <ProductRow
                    key={product.id}
                    product={product}
                    onView={() => onView(product)}
                    onEdit={() => onEdit(product)}
                    onStock={() => onStock(product)}
                />
            ))}
            {products.length < pageSize
                ? Array.from({ length: pageSize - products.length }).map((_, i) => (
                    <TableSkeletonRow key={`sk-${i}`} cellWidths={SKELETON_CELL_WIDTHS} />
                ))
                : null}
        </>
    )
}
