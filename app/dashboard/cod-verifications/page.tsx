"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Topbar } from "@/components/layout/Topbar";
import {
  Package,
  Search,
  AlertCircle,
  PhoneCall,
  Clock,
  CheckCircle2,
  Ban,
  RefreshCw,
  Phone,
} from "lucide-react";
import { format, formatRelative } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import {
  DateFilter,
  DateFilterValue,
} from "@/components/dashboard/orders/DateFilter";
import { TruncatedText } from "@/components/dashboard/orders/TruncatedText";
import {
  useCodVerificationsQuery,
  useCodVerificationStatsQuery,
} from "@/hooks/use-cod-verifications";
import type { CodVerificationItem } from "@/lib/api/cod-verifications";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CodStatusBadge } from "@/components/dashboard/cod-verifications/CodStatusBadge";
import {
  StatsCards,
  type StatCardData,
} from "@/components/dashboard/StatsCards";
import { CodVerificationModal } from "@/components/dashboard/cod-verifications/CodVerificationModal";
import { cn, formatCurrency } from "@/lib/utils";
import { TablePagination } from "@/components/common/TablePagination";

// ─── Helpers ────────────────────────────────────────────────────────────────

const VERIFICATION_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending Verification" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
];

const PAGE_SIZE = 10;

const STATUS_MAP: Record<string, string> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  rejected: "REJECTED",
};

function getDefaultDateFilter(): DateFilterValue {
  return {
    type: "all_time",
    range: {
      from: undefined,
      to: undefined,
    },
  };
}
// Helper function for relative time formatting
function formatRelativeTime(date: string | Date) {
  return formatRelative(new Date(date), new Date());
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CodVerificationsPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all",
  );
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [selectedOrder, setSelectedOrder] =
    useState<CodVerificationItem | null>(null);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(() => {
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const filterType = searchParams.get("dateType") as DateFilterValue["type"];

    if (fromDate && toDate) {
      return {
        type: filterType || "custom",
        range: {
          from: new Date(fromDate),
          to: new Date(toDate),
        },
      };
    }
    return getDefaultDateFilter();
  });

  // Build API query params
  const queryParams = {
    page,
    limit: PAGE_SIZE,
    ...(statusFilter !== "all" && { status: STATUS_MAP[statusFilter] }),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(dateFilter.range.from && {
      fromDate: format(dateFilter.range.from, "yyyy-MM-dd"),
    }),
    ...(dateFilter.range.to && {
      toDate: format(dateFilter.range.to, "yyyy-MM-dd"),
    }),
  };

  // Fetch data from API
  const {
    data: listData,
    isLoading: isLoadingList,
    error: listError,
    refetch: refetchList,
    isFetching,
  } = useCodVerificationsQuery(queryParams);
  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError,
  } = useCodVerificationStatsQuery();

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (page !== 1) params.set("page", String(page));
    if (dateFilter.range.from)
      params.set("fromDate", format(dateFilter.range.from, "yyyy-MM-dd"));
    if (dateFilter.range.to)
      params.set("toDate", format(dateFilter.range.to, "yyyy-MM-dd"));
    if (dateFilter.type && dateFilter.type !== "all_time")
      params.set("dateType", dateFilter.type);

    const newUrl = params.toString()
      ? `/dashboard/cod-verifications?${params.toString()}`
      : "/dashboard/cod-verifications";
    router.replace(newUrl, { scroll: false });
  }, [search, statusFilter, page, dateFilter, router]);

  // Check admin access
  useEffect(() => {
    if (!currentUser?.roles.includes("admin")) router.replace("/dashboard");
  }, [currentUser, router]);

  // Derive data from API response
  const items = listData?.items ?? [];
  const total = listData?.total ?? 0;
  const currentPage = listData?.page ?? page;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handlePage(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  function handleDateFilterChange(newDateFilter: DateFilterValue) {
    setDateFilter(newDateFilter);
    setPage(1);
  }

  function handleStatusChange(status: string) {
    setStatusFilter(status);
    setPage(1);
  }

  function handleSearchChange(searchValue: string) {
    setSearch(searchValue);
    setPage(1);
  }

  // Map verification status to display badge status
  function getVerificationStatus(
    item: CodVerificationItem,
  ): "pending" | "confirmed" | "rejected" {
    const status = item.verification?.verificationStatus ?? "PENDING";
    if (status === "PENDING") return "pending";
    if (status === "REJECTED") return "rejected";
    return "confirmed";
  }

  if (!currentUser?.roles.includes("admin")) {
    return null;
  }

  const isFiltering = search !== debouncedSearch;

  // Build stats cards with proper typing
  const statCards: StatCardData[] = [
    {
      label: "Total COD Orders",
      value: statsData?.totalCODOrders ?? 0,
      icon: <Package />,
      iconBg: "#eef2ff",
      iconColor: "#2b4bb9",
    },
    {
      label: "Pending Verification",
      value: statsData?.pendingVerification ?? 0,
      icon: <Clock />,
      iconBg: "#fef3c7",
      iconColor: "#d97706",
    },
    {
      label: "Verified Today",
      value: statsData?.verifiedToday ?? 0,
      icon: <CheckCircle2 />,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
    },
    {
      label: "Rejection Rate",
      value: statsData?.rejectionRate ?? "0%",
      icon: <Ban />,
      iconBg: "#fef2f2",
      iconColor: "#ef4444",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Topbar
        title="COD Verifications"
        description="Verify cash on delivery orders via phone calls"
      />

      <div className="flex-1 p-4 md:p-8 max-w-screen-2xl mx-auto w-full">
        {/* Stats cards */}
        {statsError ? (
          <div className="mb-5 md:mb-6 p-5 rounded-xl border bg-card text-card-foreground shadow-sm">
            <p className="text-sm text-destructive">
              Failed to load stats. Please try again.
            </p>
          </div>
        ) : (
          <div className="mb-5 md:mb-6">
            <StatsCards
              stats={statCards}
              isLoading={isLoadingStats}
              columns={4}
            />
          </div>
        )}

        {/* Filters bar */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 border bg-card text-card-foreground shadow-sm">
          <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by order ID, customer name, email, or phone..."
            className="flex-1 text-sm bg-transparent border-0 shadow-none px-0 focus-visible:ring-0"
          />
          {isFetching ? (
            <div className="flex items-center gap-2 text-xs shrink-0 text-muted-foreground">
              <RefreshCw
                className={cn("w-3.5 h-3.5", isFiltering && "animate-spin")}
              />
              {isFiltering ? "Searching..." : "Syncing..."}
            </div>
          ) : null}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateFilter
            value={dateFilter}
            onChange={handleDateFilterChange}
            className="min-w-45"
          />
        </div>

        {/* Orders table */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          {listError ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <p className="text-sm font-medium text-destructive mb-4">
                Failed to load COD verifications:{" "}
                {listError instanceof Error
                  ? listError.message
                  : "Unknown error"}
              </p>
              <Button onClick={() => refetchList()}>
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            </div>
          ) : (
            <>
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    {[
                      "Order ID",
                      "Time",
                      "Customer",
                      "Phone",
                      "Affiliate",
                      "Amount",
                      "Status",
                      "Action",
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="py-4 px-6 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingList ? (
                    <TableRow>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <TableCell key={i} className="py-4 px-6">
                          <div
                            className="h-3 rounded-full animate-pulse bg-muted"
                            style={{
                              width: [
                                "120px",
                                "100px",
                                "180px",
                                "120px",
                                "100px",
                                "100px",
                                "120px",
                                "100px",
                              ][i],
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-16 text-center">
                        <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                          {isFiltering
                            ? "Searching..."
                            : "No COD orders match your filters."}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const verificationStatus = getVerificationStatus(item);
                      const hasAffiliate = item.affiliateId !== null;

                      return (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer transition-colors"
                          onClick={() => setSelectedOrder(item)}
                        >
                          <TableCell className="py-4 px-6">
                            <TruncatedText
                              text={item.orderNumber}
                              maxLength={12}
                              className="text-xs font-mono font-bold text-primary"
                            />
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className="text-sm font-medium">
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div>
                              <p className="text-sm font-semibold">
                                {item.user.name}
                              </p>
                              <p className="text-xs mt-0.5 text-muted-foreground">
                                {item.user.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <a
                              href={`tel:${item.user.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors hover:bg-muted text-primary"
                            >
                              <Phone className="w-3 h-3" />
                              {item.user.phone}
                            </a>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            {hasAffiliate ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                <Package className="w-3 h-3" />
                                Affiliated
                              </span>
                            ) : (
                              <span className="text-xs italic text-muted-foreground">
                                Direct
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className="text-sm  tabular-nums text-primary">
                              {formatCurrency(item.totalAmount, item.currency)}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <CodStatusBadge status={verificationStatus} />
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            {verificationStatus === "pending" && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(item);
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-auto px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                Verify
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {!isLoadingList && totalPages > 1 && (
                <TablePagination
                  page={currentPage}
                  totalPages={totalPages}
                  total={total}
                  pageSize={PAGE_SIZE}
                  onChange={handlePage}
                />
              )}
            </>
          )}
        </div>
      </div>

      {selectedOrder && (
        <CodVerificationModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
