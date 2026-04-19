import { useCreateWithdrawal } from "@/hooks/use-withdrawals";
import { AlertCircle, Banknote, CheckCircle, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/client";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function RequestModal({
  availableBalance,
  pendingWithdrawals,
  onClose,
  createMutation,
  error,
}: {
  availableBalance: number;
  pendingWithdrawals: number;
  onClose: () => void;
  error?: string;
  createMutation: ReturnType<typeof useCreateWithdrawal>;
}) {
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [done, setDone] = useState(false);
  const val = parseFloat(amount);
  const hasPending = pendingWithdrawals > 0;
  const isValid =
    !hasPending && !isNaN(val) && val > 0 && val <= availableBalance;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    try {
      await createMutation.mutateAsync({
        amount: val,
        ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
      });
      setDone(true);
      setTimeout(onClose, 1600);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Failed to submit withdrawal request"),
      );
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-full max-w-sm rounded-[16px] !p-0 gap-0 overflow-hidden outline-none border-none"
        style={{
          background: "#fff",
          boxShadow: "0 32px 80px rgba(19,27,46,0.18)",
        }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Request Withdrawal</DialogTitle>
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
              Request Withdrawal
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
              Funds will be sent to your registered bank
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

        {done ? (
          <div className="px-6 py-10 flex flex-col items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "#f0fdf4" }}
            >
              <CheckCircle className="w-7 h-7" style={{ color: "#16a34a" }} />
            </div>
            <p className="text-base font-bold" style={{ color: "#0f172a" }}>
              Request Submitted!
            </p>
            <p className="text-sm text-center" style={{ color: "#6b7280" }}>
              Your withdrawal request is now pending admin review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {hasPending && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: "#fffbeb", border: "1.5px solid #fde68a" }}
              >
                <AlertCircle
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "#b45309" }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#92400e" }}
                >
                  You already have a pending withdrawal request (NPR{" "}
                  {pendingWithdrawals.toFixed(2)}). Please wait for it to be
                  processed.
                </span>
              </div>
            )}

            {/* Available balance */}
            <div
              className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: "#f8faff" }}
            >
              <div>
                <p
                  className="text-xs uppercase tracking-widest font-bold mb-0.5"
                  style={{ color: "#9ca3af" }}
                >
                  Available Balance
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{
                    color: "#0f172a",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  NPR {availableBalance.toFixed(2)}
                </p>
              </div>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "#eef2ff" }}
              >
                <Banknote className="w-5 h-5" style={{ color: "#2b4bb9" }} />
              </div>
            </div>
            {error && (
              <p
                className="text-xs mt-1.5 flex items-center gap-1"
                style={{ color: "#dc2626" }}
              >
                {error}
              </p>
            )}

            {/* Amount input */}
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                style={{ color: "#9ca3af" }}
              >
                Withdraw Amount (NPR)
              </label>
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl focus-within:ring-2 ring-primary/20 transition-all border"
                style={{ background: "#fff", borderColor: "#e2e8f0" }}
              >
                <span
                  className="text-base font-semibold"
                  style={{ color: "#9ca3af" }}
                >
                  NPR
                </span>
                <Input
                  type="number"
                  min={1}
                  step={0.01}
                  max={availableBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={hasPending}
                  className="flex-1 text-base font-semibold bg-transparent shadow-none border-0 px-0 h-auto disabled:hover:cursor-not-allowed focus-visible:ring-0"
                  style={{ color: "#0f172a" }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setAmount(
                      (parseFloat(availableBalance.toFixed(2)) - 1).toString(),
                    )
                  }
                  disabled={!!hasPending || availableBalance <= 1}
                  className="h-auto text-xs font-bold px-2 py-1 rounded-lg hover:bg-indigo-100 hover:disabled:cursor-not-allowed"
                  style={{ background: "#eef2ff", color: "#2b4bb9" }}
                >
                  Max
                </Button>
              </div>
              {amount && !hasPending && !isValid && (
                <p
                  className="text-xs mt-1.5 flex items-center gap-1"
                  style={{ color: "#dc2626" }}
                >
                  <AlertCircle className="w-3 h-3" />
                  {val > availableBalance
                    ? `Exceeds available balance (NPR ${availableBalance.toFixed(2)})`
                    : "Enter a valid amount"}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                style={{ color: "#9ca3af" }}
              >
                Remarks <span className="font-normal">(optional)</span>
              </label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add a note for admin..."
                disabled={hasPending}
                rows={2}
                className="rounded-xl text-sm resize-none focus-visible:ring-primary/20"
                style={{ borderColor: "#e2e8f0" }}
              />
            </div>

            <Button
              type="submit"
              disabled={!isValid || createMutation.isPending}
              className="w-full py-6 rounded-xl text-sm font-bold text-white hover:opacity-90 hover:disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)",
              }}
            >
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Request"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
