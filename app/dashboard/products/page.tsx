'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Topbar } from '@/components/layout/Topbar'
import { useProductsQuery } from '@/hooks/use-products'
import type { ProductListItem } from '@/lib/api/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ProductDetailDialog } from '@/components/dashboard/products/ProductDetailDialog'
import { ProductsPagination } from '@/components/dashboard/products/ProductsPagination'
import { ProductsTableBody } from '@/components/dashboard/products/ProductsTableBody'
import { Search, X, Package, Eye, AlertTriangle, RefreshCw } from 'lucide-react'

const PAGE_SIZE = 5

export default function ProductsPage() {
    const currentUser = useAuthStore((s) => s.currentUser)
    const router = useRouter()
    const isAdmin = currentUser?.roles.includes('admin')

    const [search, setSearch] = useState('')
    const deferredSearch = useDeferredValue(search)
    const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null)
    const [page, setPage] = useState(1)

    const productsQuery = useProductsQuery({
        page,
        limit: PAGE_SIZE,
        search: deferredSearch.trim() || undefined,
    })

    const products = productsQuery.data?.items ?? []
    const totalProducts = productsQuery.data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE))
    const safePage = Math.min(page, totalPages)

    useEffect(() => {
        if (safePage !== page) {
            setPage(safePage)
        }
    }, [page, safePage])

    const lowStockCount = useMemo(
        () => products.filter((product) => product.totalStock > 0 && product.totalStock <= 40).length,
        [products],
    )

    const inStockCount = useMemo(
        () => products.filter((product) => product.totalStock > 0).length,
        [products],
    )

    const isFiltering = search !== deferredSearch

    const handleSearch = (val: string) => {
        setSearch(val)
        setPage(1)
    }

    return (
        <div className="flex flex-col min-h-screen" style={{ background: '#f8faff' }}>
            <Topbar title="Products" description="Manage your product catalog" />

            <div className="flex-1 p-4 md:p-8 max-w-360">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between mb-6 md:mb-8">
                    <div>
                        <h1
                            className="text-2xl md:text-3xl font-bold text-balance"
                            style={{
                                fontFamily: 'var(--font-display)',
                                color: '#0f1623',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Product Inventory
                        </h1>
                        <p
                            className="text-sm mt-1.5 max-w-md hidden sm:block"
                            style={{ color: '#6b7280', lineHeight: '1.5' }}
                        >
                            Browse your live catalog, search backend records, and manage stock operations from a
                            single inventory view.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">
                    <div
                        className="flex items-center gap-4 px-6 py-5 rounded-2xl"
                        style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', minWidth: '180px' }}
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: '#eef2ff' }}
                        >
                            <Package className="w-5 h-5" style={{ color: '#2b4bb9' }} />
                        </div>
                        <div>
                            <p
                                className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                                style={{ color: '#9ca3af' }}
                            >
                                Total Products
                            </p>
                            <p
                                className="text-2xl font-bold"
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    color: '#0f1623',
                                    letterSpacing: '-0.03em',
                                }}
                            >
                                {totalProducts.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div
                        className="flex items-center gap-4 px-6 py-5 rounded-2xl"
                        style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)', minWidth: '180px' }}
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: '#fef2f2' }}
                        >
                            <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} />
                        </div>
                        <div>
                            <p
                                className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                                style={{ color: '#9ca3af' }}
                            >
                                Low Stock In View
                            </p>
                            <p
                                className="text-2xl font-bold"
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    color: '#dc2626',
                                    letterSpacing: '-0.03em',
                                }}
                            >
                                {lowStockCount}
                            </p>
                        </div>
                    </div>

                    <div
                        className="flex items-center gap-4 px-6 py-5 rounded-2xl"
                        style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: '#f0fdf4' }}
                        >
                            <Eye className="w-5 h-5" style={{ color: '#16a34a' }} />
                        </div>
                        <div>
                            <p
                                className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                                style={{ color: '#9ca3af' }}
                            >
                                Products In View
                            </p>
                            <p
                                className="text-2xl font-bold"
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    color: '#16a34a',
                                    letterSpacing: '-0.03em',
                                }}
                            >
                                {inStockCount}/{products.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
                    style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}
                >
                    <Search className="w-4 h-4 shrink-0" style={{ color: '#9ca3af' }} />
                    <Input
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search by title or slug..."
                        className="flex-1 text-sm bg-transparent border-0 shadow-none px-0 focus-visible:ring-0"
                        style={{ color: '#0f1623' }}
                    />
                    {productsQuery.isFetching ? (
                        <div className="flex items-center gap-2 text-xs shrink-0" style={{ color: '#6b7280' }}>
                            <RefreshCw className={`w-3.5 h-3.5 ${isFiltering ? 'animate-spin' : ''}`} />
                            {isFiltering ? 'Searching...' : 'Syncing...'}
                        </div>
                    ) : null}
                    {search ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleSearch('')}
                            style={{ color: '#9ca3af' }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    ) : null}
                </div>

                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#fff', boxShadow: '0 1px 4px rgba(19,27,46,0.06)' }}
                >
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow style={{ borderBottom: '1px solid #f4f5ff', background: '#fafbff' }}>
                                {['ID', 'Product', 'Status', 'Stock Level', 'Pricing', 'Actions'].map((label) => (
                                    <TableHead
                                        key={label}
                                        className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider"
                                        style={{ color: '#9ca3af' }}
                                    >
                                        {label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <ProductsTableBody
                                isLoading={productsQuery.isLoading}
                                isError={productsQuery.isError}
                                error={productsQuery.error}
                                products={products}
                                deferredSearch={deferredSearch}
                                pageSize={PAGE_SIZE}
                                onRetry={() => productsQuery.refetch()}
                                onView={(product) => setSelectedProduct(product)}
                                onEdit={() => { }}
                                onStock={(product) => router.push(`/dashboard/products/${product.id}/stock`)}
                            />
                        </TableBody>
                    </Table>

                    <ProductsPagination
                        page={safePage}
                        totalPages={totalPages}
                        total={totalProducts}
                        pageSize={PAGE_SIZE}
                        onChange={setPage}
                    />
                </div>
            </div>

            <ProductDetailDialog
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onAdjustStock={(productId) => {
                    router.push(`/dashboard/products/${productId}/stock`)
                    setSelectedProduct(null)
                }}
            />
        </div>
    )
}
