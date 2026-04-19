"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/stores/auth-store";
import { Topbar } from "@/components/layout/Topbar";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  StatsCards,
  type StatCardData,
} from "@/components/dashboard/StatsCards";
import { TableSkeletonRow } from "@/components/dashboard/TableSkeletonRow";

import {
  useWithdrawalsQuery,
  useWithdrawalBalanceQuery,
  useCreateWithdrawal,
} from "@/hooks/use-withdrawals";
import { getApiErrorMessage } from "@/lib/api/client";

import type {
  WithdrawalStatusAPI,
  WithdrawalListItem,
} from "@/lib/api/withdrawals";

import {
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  X,
  Image as ImageIcon,
  AlertCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { formatRelative } from "date-fns";
import { TablePagination } from "@/components/common/TablePagination";

const PAGE_SIZE = 20;

// ── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: WithdrawalStatusAPI }) {
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

function RequestModal({
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

function DetailModal({
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

export default function MyWithdrawalsPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && !currentUser.roles.includes("vendor")) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [showRequest, setShowRequest] = useState(false);
  const [detailItem, setDetailItem] = useState<WithdrawalListItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | WithdrawalStatusAPI>(
    (searchParams.get("status") as "all" | WithdrawalStatusAPI) || "all",
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (page !== 1) params.set("page", String(page));
    const newUrl = params.toString()
      ? `/dashboard/my-withdrawals?${params.toString()}`
      : "/dashboard/my-withdrawals";
    router.replace(newUrl, { scroll: false });
  }, [statusFilter, page, router]);

  const { data: balanceData, isLoading: balanceLoading } =
    useWithdrawalBalanceQuery();

  const { data: withdrawalsData, isLoading: listLoading } = useWithdrawalsQuery(
    {
      page,
      limit: PAGE_SIZE,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    },
  );

  const createMutation = useCreateWithdrawal();

  const items = withdrawalsData?.items ?? [];
  const total = withdrawalsData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handlePage(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }
  // Build stats cards with proper typing
  const statCards: StatCardData[] = [
    {
      label: "Available Balance",
      value: balanceData
        ? `NPR ${balanceData.availableBalance.toFixed(2)}`
        : "—",
      icon: <Banknote />,
      iconBg: "#eef2ff",
      iconColor: "#2b4bb9",
    },
    {
      label: "Total Earnings",
      value: balanceData ? `NPR ${balanceData.totalEarnings.toFixed(2)}` : "—",
      icon: <TrendingUp />,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
    },
    {
      label: "Pending Amount",
      value: balanceData
        ? `NPR ${balanceData.pendingWithdrawals.toFixed(2)}`
        : "—",
      icon: <Clock />,
      iconBg: "#fffbeb",
      iconColor: "#b45309",
    },
    {
      label: "Approved Amount",
      value: balanceData
        ? `NPR ${balanceData.approvedWithdrawals.toFixed(2)}`
        : "—",
      icon: <CheckCircle />,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
    },
  ];

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--surface-container-lowest)" }}
    >
      <Topbar
        title="Withdrawal Requests"
        description="Manage your withdrawal requests and track payment status"
      />

      <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-6 max-w-screen-2xl mx-auto w-full">
        {/* Stat cards */}
        <StatsCards stats={statCards} isLoading={balanceLoading} columns={4} />

        {/* Toolbar + Table */}
        <Card
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#fff",
            boxShadow: "0 1px 4px rgba(19,27,46,0.06)",
            border: "1px solid #f1f5f9",
          }}
        >
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid #f4f5ff" }}
          >
            <div>
              <h2 className="text-base font-bold" style={{ color: "#0f172a" }}>
                Request History
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                {listLoading
                  ? "..."
                  : `${total} request${total !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val as "all" | WithdrawalStatusAPI);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] pl-3.5 pr-2 py-2 rounded-xl text-sm font-medium h-auto border-[#f1f5f9] bg-[#f8faff] text-[#374151] focus:ring-0 shadow-none">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setShowRequest(true)}
                disabled={balanceData?.availableBalance === 0}
                className="flex items-center gap-2 px-4 h-auto py-2 rounded-xl text-sm font-bold text-white whitespace-nowrap"
                style={{
                  background:
                    "linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)",
                }}
              >
                <Plus className="w-4 h-4" />
                New Request
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow
                  style={{
                    background: "#fafbff",
                    borderBottom: "1px solid #f4f5ff",
                  }}
                  className="hover:bg-transparent"
                >
                  {[
                    "Request ID",
                    "Amount",
                    "Requested On",
                    "Processed On",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: "#9ca3af" }}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {listLoading ? (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableSkeletonRow
                        key={i}
                        cellWidths={[100, 80, 120, 120, 100, 100]}
                      />
                    ))}
                  </>
                ) : items.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: "#f4f5ff" }}
                        >
                          <Banknote
                            className="w-5 h-5"
                            style={{ color: "#9ca3af" }}
                          />
                        </div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "#6b7280" }}
                        >
                          {statusFilter !== "all"
                            ? `No ${statusFilter.toLowerCase()} withdrawal requests found`
                            : "No withdrawal requests found"}
                        </p>
                        {statusFilter === "all" && (
                          <Button
                            variant="link"
                            onClick={() => setShowRequest(true)}
                            className="text-sm font-semibold h-auto p-0"
                            style={{ color: "#2b4bb9" }}
                          >
                            Make your first request
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((w) => (
                    <TableRow
                      key={w.id}
                      style={{ borderBottom: "1px solid #f4f5ff" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#fafbff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <TableCell className="py-5 px-6">
                        <span
                          className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
                          style={{ background: "#eef2ff", color: "#2b4bb9" }}
                        >
                          {w.id.slice(0, 8).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="py-5 px-6">
                        <span
                          className="text-sm font-bold tabular-nums"
                          style={{ color: "#0f172a" }}
                        >
                          {w.currency} {w.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="py-5 px-6">
                        <span className="text-sm" style={{ color: "#6b7280" }}>
                          {formatRelative(new Date(w.requestedAt), new Date())}
                        </span>
                      </TableCell>
                      <TableCell className="py-5 px-6">
                        <span className="text-sm" style={{ color: "#6b7280" }}>
                          {w.processedAt
                            ? formatRelative(
                                new Date(w.processedAt),
                                new Date(),
                              )
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="py-5 px-6">
                        <StatusPill status={w.status} />
                      </TableCell>
                      <TableCell className="py-5 px-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailItem(w)}
                          className="flex h-auto items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#eef2ff]"
                          style={{ color: "#2b4bb9" }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <TablePagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onChange={handlePage}
            />
          )}
        </Card>
      </div>

      {/* Modals */}
      {showRequest && balanceData && (
        <RequestModal
          availableBalance={balanceData.availableBalance}
          pendingWithdrawals={balanceData.pendingWithdrawals}
          onClose={() => setShowRequest(false)}
          createMutation={createMutation}
          error={
            createMutation.error
              ? getApiErrorMessage(
                  createMutation.error,
                  "Failed to submit withdrawal request",
                )
              : undefined
          }
        />
      )}
      {detailItem && (
        <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      )}
    </div>
  );
}
