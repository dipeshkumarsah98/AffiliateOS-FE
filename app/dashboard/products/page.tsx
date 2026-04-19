"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Topbar } from "@/components/layout/Topbar";
import { useProductsQuery } from "@/hooks/use-products";
import type { ProductListItem } from "@/lib/api/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  StatsCards,
  type StatCardData,
} from "@/components/dashboard/StatsCards";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductDetailDialog } from "@/components/dashboard/products/ProductDetailDialog";
import { ProductsTableBody } from "@/components/dashboard/products/ProductsTableBody";
import {
  Search,
  X,
  Package,
  Eye,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/common/TablePagination";

const PAGE_SIZE = 5;

export default function ProductsPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const router = useRouter();
  const isAdmin = currentUser?.roles.includes("admin");

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductListItem | null>(null);
  const [page, setPage] = useState(1);

  const productsQuery = useProductsQuery({
    page,
    limit: PAGE_SIZE,
    search: deferredSearch.trim() || undefined,
  });

  const products = productsQuery.data?.items ?? [];
  const totalProducts = productsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (safePage !== page) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const lowStockCount = useMemo(
    () =>
      products.filter(
        (product) => product.totalStock > 0 && product.totalStock <= 40,
      ).length,
    [products],
  );

  const inStockCount = useMemo(
    () => products.filter((product) => product.totalStock > 0).length,
    [products],
  );

  const isFiltering = search !== deferredSearch;

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  function handlePage(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }
  // Build stats cards with proper typing
  const statCards: StatCardData[] = [
    {
      label: "Total Products",
      value: totalProducts.toLocaleString(),
      icon: <Package />,
      iconBg: "#eef2ff",
      iconColor: "#2b4bb9",
    },
    {
      label: "Low Stock In View",
      value: lowStockCount,
      icon: <AlertTriangle />,
      iconBg: "#fee2e2",
      iconColor: "#dc2626",
    },
    {
      label: "Products In View",
      value: `${inStockCount}/${products.length}`,
      icon: <Eye />,
      iconBg: "#d1fae5",
      iconColor: "#059669",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Topbar title="Products" description="Manage your product catalog" />

      <div className="flex-1 p-4 md:p-8 max-w-screen-2xl mx-auto w-full">
        <div className="mb-5 md:mb-6">
          <StatsCards
            stats={statCards}
            isLoading={productsQuery.isLoading}
            columns={3}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 border bg-card text-card-foreground shadow-sm">
          <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by title or slug..."
            className="flex-1 text-sm bg-transparent border-0 shadow-none px-0 focus-visible:ring-0 text-foreground"
          />
          {productsQuery.isFetching ? (
            <div className="flex items-center gap-2 text-xs shrink-0 text-muted-foreground">
              <RefreshCw
                className={cn("w-3.5 h-3.5", isFiltering && "animate-spin")}
              />
              {isFiltering ? "Searching..." : "Syncing..."}
            </div>
          ) : null}
          {search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => handleSearch("")}
            >
              <X className="w-4 h-4" />
            </Button>
          ) : null}
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {[
                  "ID",
                  "Product",
                  "Status",
                  "Stock Level",
                  "Pricing",
                  "Actions",
                ].map((label) => (
                  <TableHead
                    key={label}
                    className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground"
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
                onEdit={() => {}}
                onStock={(product) =>
                  router.push(`/dashboard/products/${product.id}/stock`)
                }
              />
            </TableBody>
          </Table>

          {!productsQuery.isLoading && totalPages > 1 && (
            <TablePagination
              page={safePage}
              totalPages={totalPages}
              total={totalProducts}
              pageSize={PAGE_SIZE}
              onChange={handlePage}
            />
          )}
        </div>
      </div>

      <ProductDetailDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdjustStock={(productId) => {
          router.push(`/dashboard/products/${productId}/stock`);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
}
