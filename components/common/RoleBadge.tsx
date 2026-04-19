export default function RoleBadge({ role }: { role: string }) {
  const map: Record<
    string,
    { bg: string; color: string; dot: string; label: string }
  > = {
    admin: { bg: "#fff8e6", color: "#b45309", dot: "#f59e0b", label: "Admin" },
    vendor: {
      bg: "#eef2ff",
      color: "#3730a3",
      dot: "#6366f1",
      label: "Vendor",
    },
    staff: { bg: "#f3e8ff", color: "#6b21a8", dot: "#9333ea", label: "Staff" },
    customer: {
      bg: "#f0fdf4",
      color: "#15803d",
      dot: "#22c55e",
      label: "Customer",
    },
  };
  const s = map[role.toLowerCase()] || {
    bg: "#f1f5f9",
    color: "#475569",
    dot: "#94a3b8",
    label: role.toUpperCase(),
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: s.dot }}
      />
      {s.label}
    </span>
  );
}
