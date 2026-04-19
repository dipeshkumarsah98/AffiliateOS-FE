import { WithdrawalListItem } from "@/lib/api/withdrawals";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";
import StatusPill from "./StatusPill";

export default function DetailModal({
  item,
  onClose,
}: {
  item: WithdrawalListItem;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-full max-w-md rounded-[16px] !p-0 gap-0 overflow-hidden outline-none border-none"
        style={{
          background: "#fff",
          boxShadow: "0 32px 80px rgba(19,27,46,0.18)",
        }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Withdrawal Detail</DialogTitle>
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-[#f8faff]">
          <div>
            <h2
              className="text-lg font-bold"
              style={{
                color: "#0f172a",
                letterSpacing: "-0.02em",
                fontFamily: "var(--font-display)",
              }}
            >
              Withdrawal Detail
            </h2>
            <p
              className="text-xs mt-0.5 font-mono"
              style={{ color: "#9ca3af" }}
            >
              ID: {item.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#f1f5f9]"
            style={{ color: "#6b7280" }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount + status */}
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs uppercase tracking-widest font-bold mb-1"
                style={{ color: "#9ca3af" }}
              >
                Amount Requested
              </p>
              <p
                className="text-3xl font-bold"
                style={{
                  color: "#0f172a",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.03em",
                }}
              >
                {item.currency} {item.amount.toFixed(2)}
              </p>
            </div>
            <StatusPill status={item.status} />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: "#f8faff" }}>
              <p
                className="text-xs uppercase tracking-widest font-bold mb-1"
                style={{ color: "#9ca3af" }}
              >
                Requested
              </p>
              <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                {new Date(item.requestedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            {item.processedAt && (
              <div className="rounded-xl p-3" style={{ background: "#f8faff" }}>
                <p
                  className="text-xs uppercase tracking-widest font-bold mb-1"
                  style={{ color: "#9ca3af" }}
                >
                  Processed
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#0f172a" }}
                >
                  {new Date(item.processedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Approved */}
          {item.status === "APPROVED" && (
            <>
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: "#f0fdf4", border: "1.5px solid #86efac" }}
              >
                <CheckCircle
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "#16a34a" }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#15803d" }}
                >
                  Payment has been approved and processed.
                </span>
              </div>
              {item.remarks && (
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: "#9ca3af" }}
                  >
                    Admin Note
                  </p>
                  <p
                    className="text-sm leading-relaxed px-4 py-3 rounded-xl"
                    style={{
                      background: "#f8faff",
                      color: "#374151",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    {item.remarks}
                  </p>
                </div>
              )}
              {item.transactionProof ? (
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: "#9ca3af" }}
                  >
                    Payment Proof
                  </p>
                  <img
                    src={item.transactionProof}
                    alt="Payment confirmation"
                    className="w-full rounded-xl object-cover"
                    style={{ border: "1px solid #f1f5f9", maxHeight: "200px" }}
                  />
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: "#f8faff",
                    border: "1px dashed #e2e8f0",
                  }}
                >
                  <ImageIcon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "#9ca3af" }}
                  />
                  <span className="text-sm" style={{ color: "#9ca3af" }}>
                    No payment proof provided by admin.
                  </span>
                </div>
              )}
            </>
          )}

          {/* Rejected */}
          {item.status === "REJECTED" && (
            <>
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: "#fef2f2", border: "1.5px solid #fca5a5" }}
              >
                <XCircle
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "#dc2626" }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#b91c1c" }}
                >
                  This request was rejected.
                </span>
              </div>
              {item.rejectionReason ? (
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: "#9ca3af" }}
                  >
                    Rejection Reason
                  </p>
                  <p
                    className="text-sm leading-relaxed px-4 py-3 rounded-xl"
                    style={{
                      background: "#f8faff",
                      color: "#374151",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    {item.rejectionReason}
                  </p>
                </div>
              ) : item.remarks ? (
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: "#9ca3af" }}
                  >
                    Rejection Reason
                  </p>
                  <p
                    className="text-sm leading-relaxed px-4 py-3 rounded-xl"
                    style={{
                      background: "#f8faff",
                      color: "#374151",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    {item.remarks}
                  </p>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "#9ca3af" }}>
                  No reason provided by admin.
                </p>
              )}
            </>
          )}

          {/* Pending */}
          {item.status === "PENDING" && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: "#fffbeb", border: "1.5px solid #fde68a" }}
            >
              <Clock
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "#b45309" }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: "#92400e" }}
              >
                Awaiting admin review. You will be notified once processed.
              </span>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full py-6 rounded-xl text-sm font-semibold hover:bg-[#f1f5f9] transition-colors"
            style={{ background: "#f8faff", color: "#6b7280" }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
