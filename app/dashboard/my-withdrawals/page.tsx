"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
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

import { Banknote, Clock, CheckCircle, Plus, TrendingUp } from "lucide-react";
import { formatRelative } from "date-fns";
import dynamic from "next/dynamic";
import StatusPill from "@/components/dashboard/withdrawals/StatusPill";

const PAGE_SIZE = 20;

const DynamicTablePagination = dynamic(() =>
  import("@/components/common/TablePagination").then(
    (mod) => mod.TablePagination,
  ),
);

const DynamicRequestModal = dynamic(() =>
  import("@/components/dashboard/withdrawals/RequestModal").then(
    (mod) => mod.default,
  ),
);

const DynamicDetailModal = dynamic(() =>
  import("@/components/dashboard/withdrawals/DetailModal").then(
    (mod) => mod.default,
  ),
);

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
            <DynamicTablePagination
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
        <DynamicRequestModal
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
        <DynamicDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
}
