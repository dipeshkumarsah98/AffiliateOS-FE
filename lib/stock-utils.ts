export type StockHealth = {
  label: string;
  color: string;
};

export function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);

  if (h < 1) return "Just now";
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  if (d === 1) return "Yesterday";

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function stockHealth(stock: number): StockHealth {
  if (stock === 0) return { label: "Out of Stock", color: "#dc2626" };
  if (stock <= 10) return { label: "Critical", color: "#dc2626" };
  if (stock <= 40) return { label: "Low", color: "#f59e0b" };
  if (stock <= 150) return { label: "Moderate", color: "#3b82f6" };
  return { label: "Healthy", color: "#16a34a" };
}

export function getMovementReasonLabel(reason: string) {
  return reason
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
