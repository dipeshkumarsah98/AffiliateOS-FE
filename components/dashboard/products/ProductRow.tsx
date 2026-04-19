import type { ProductListItem } from "@/lib/api/products";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Eye, PackagePlus } from "lucide-react";
import {
  getProductDisplayId,
  getProductImage,
  statusBadge,
  stockHealth,
} from "@/components/dashboard/products/helpers";
import { formatRelative } from "date-fns";
import Image from "next/image";

type ProductRowProps = {
  product: ProductListItem;
  onView: () => void;
  onEdit: () => void;
  onStock: () => void;
};

export function ProductRow({
  product,
  onView,
  onEdit,
  onStock,
}: ProductRowProps) {
  const health = stockHealth(product.totalStock);
  const badge = statusBadge(product.status);
  const productId = getProductDisplayId(product);

  return (
    <TableRow
      className="transition-colors"
      style={{ borderBottom: "1px solid #f4f5ff" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#fafbff")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <TableCell className="py-5 px-6">
        <span
          className="text-xs font-mono font-bold"
          style={{ color: "#2b4bb9" }}
        >
          {productId}
        </span>
      </TableCell>

      <TableCell className="py-5 px-6">
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
            style={{ background: "#eef2ff" }}
          >
            <Image
              src={getProductImage(product)}
              alt={product.title}
              className="w-full h-full object-cover"
              width={"130"}
              height={"140"}
            />
          </div>
          <div>
            <p
              className="text-sm font-semibold leading-snug"
              style={{ color: "#0f1623" }}
            >
              {product.title}
            </p>
            <p
              className="text-xs mt-0.5 font-mono"
              style={{ color: "#9ca3af" }}
            >
              {product.slug}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell className="py-5 px-6">
        <Badge
          className="text-xs font-semibold px-2.5 py-1 rounded-lg border-0"
          style={{ background: badge.bg, color: badge.text }}
        >
          {badge.label}
        </Badge>
      </TableCell>

      <TableCell className="py-5 px-6">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: "#0f1623" }}
          >
            {product.totalStock.toLocaleString()}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: `${health.color}18`, color: health.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: health.color }}
            />
            {health.label}
          </span>
        </div>
      </TableCell>

      <TableCell className="py-5 px-6">
        <p
          className="text-sm font-bold tabular-nums"
          style={{ color: "#2b4bb9" }}
        >
          {formatCurrency(product.price, "NPR")}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
          Updated {formatRelative(new Date(product.updatedAt), new Date())}
        </p>
      </TableCell>

      <TableCell className="py-5 px-6">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onView}
            className="h-auto px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#eef2ff]"
            style={{ color: "#2b4bb9" }}
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onStock}
            className="h-auto px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#f0fdf4]"
            style={{ color: "#16a34a" }}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            Stock
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
