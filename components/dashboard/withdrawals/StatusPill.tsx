// ── Status pill ──────────────────────────────────────────────────────────────
import { WithdrawalStatusAPI } from "@/lib/api/withdrawals";

export default function StatusPill({
  status,
}: {
  status: WithdrawalStatusAPI;
}) {
  if (status === "APPROVED")
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: "#f0fdf4", color: "#15803d" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
        Approved
      </span>
    );
  if (status === "REJECTED")
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: "#fef2f2", color: "#b91c1c" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
        Rejected
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: "#fffbeb", color: "#b45309" }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
      Pending
    </span>
  );
}
