import type { ProductListItem } from "@/lib/api/products";

export const PRODUCT_IMAGE_FALLBACK =
  "https://placehold.co/400x400/eef2ff/2b4bb9?text=Product";

export function stockHealth(stock: number): {
  label: string;
  color: string;
  bar: string;
  pct: number;
} {
  if (stock === 0) {
    return { label: "Out of Stock", color: "#dc2626", bar: "#dc2626", pct: 0 };
  }

  if (stock <= 10) {
    return {
      label: "Critical",
      color: "#dc2626",
      bar: "#dc2626",
      pct: Math.min(100, (stock / 10) * 100),
    };
  }

  if (stock <= 40) {
    return {
      label: "Low",
      color: "#f59e0b",
      bar: "#f59e0b",
      pct: Math.min(100, (stock / 100) * 100),
    };
  }

  if (stock <= 150) {
    return {
      label: "Moderate",
      color: "#3b82f6",
      bar: "#3b82f6",
      pct: Math.min(100, (stock / 200) * 100),
    };
  }

  if (stock === Infinity || stock > 5000) {
    return { label: "Managed", color: "#2b4bb9", bar: "#2b4bb9", pct: 100 };
  }

  return {
    label: "Healthy",
    color: "#16a34a",
    bar: "#16a34a",
    pct: Math.min(100, (stock / 400) * 100),
  };
}

export function statusBadge(status: string): {
  bg: string;
  text: string;
  label: string;
} {
  const normalized = status.toLowerCase();

  if (normalized === "active" || normalized === "published") {
    return { bg: "#dcfce7", text: "#15803d", label: "Active" };
  }

  if (normalized === "draft") {
    return { bg: "#fef3c7", text: "#b45309", label: "Draft" };
  }

  if (normalized === "archived" || normalized === "inactive") {
    return { bg: "#f3f4f6", text: "#4b5563", label: "Archived" };
  }

  return {
    bg: "#eef2ff",
    text: "#2b4bb9",
    label: normalized
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
  };
}

export function getProductImage(product: ProductListItem): string {
  return product.images[0] || PRODUCT_IMAGE_FALLBACK;
}

export function getProductDisplayId(product: ProductListItem): string {
  return `#${product.id.slice(0, 8).toUpperCase()}`;
}
