export default function UserAvatar({ name }: { name: string }) {
  const safeName = name || "?";
  const initials = safeName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = [
    ["#dbeafe", "#1d4ed8"],
    ["#dcfce7", "#166534"],
    ["#fce7f3", "#9d174d"],
    ["#fef9c3", "#92400e"],
    ["#ede9fe", "#6d28d9"],
    ["#fee2e2", "#991b1b"],
  ];
  const charCode = safeName.charCodeAt(0) || 0;
  const idx = charCode % colors.length;

  return (
    <div
      className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-xs font-bold"
      style={{ background: colors[idx][0], color: colors[idx][1] }}
    >
      {initials}
    </div>
  );
}
