"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatRelative, parseISO } from "date-fns";
import {
  Users,
  Store,
  ShieldCheck,
  Briefcase,
  Search,
  RefreshCw,
  ChevronDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useAuthStore } from "@/stores/auth-store";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchUsers } from "@/hooks/use-users";

import StatCardSkeleton from "@/components/common/StatCardSkeleton";
import { TableSkeletonRow } from "@/components/dashboard/TableSkeletonRow";
// Note: WithdrawalsPagination uses typical pagination logic, but for self-containment we'll implement inline mimicking their logic.
import { toast } from "sonner";

// ── Constants & Helpers ──────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function RoleBadge({ role }: { role: string }) {
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

function UserAvatar({ name }: { name: string }) {
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

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      style={{ borderTop: "1px solid #f4f5ff" }}
    >
      <span className="text-sm" style={{ color: "#6b7280" }}>
        Showing{" "}
        <strong className="font-semibold" style={{ color: "#0f172a" }}>
          {from}
        </strong>{" "}
        to{" "}
        <strong className="font-semibold" style={{ color: "#0f172a" }}>
          {to}
        </strong>{" "}
        of{" "}
        <strong className="font-semibold" style={{ color: "#0f172a" }}>
          {total}
        </strong>{" "}
        users
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg hover:bg-muted"
          style={{ color: "#9ca3af" }}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`e${i}`}
              className="w-8 h-8 flex items-center justify-center text-sm"
              style={{ color: "#9ca3af" }}
            >
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant="ghost"
              size="icon"
              onClick={() => onChange(p as number)}
              className="w-8 h-8 rounded-lg text-sm font-medium"
              style={
                p === page
                  ? { background: "#2b4bb9", color: "#fff" }
                  : { background: "transparent", color: "#374151" }
              }
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg hover:bg-muted"
          style={{ color: "#9ca3af" }}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useAuthStore((s) => s.currentUser);

  // Admin guard
  useEffect(() => {
    if (currentUser && !currentUser.roles.includes("admin")) {
      toast.error("Access denied. Admin only.");
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  // Current states
  const [page, setPage] = useState(() => {
    const p = searchParams.get("page");
    return p ? parseInt(p, 10) : 1;
  });

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 500);

  const [roleFilter, setRoleFilter] = useState<string>(() => {
    return searchParams.get("role") || "all";
  });

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (search.trim()) params.set("search", search.trim());
    if (roleFilter !== "all") params.set("role", roleFilter);

    const url = params.toString()
      ? `/dashboard/users?${params.toString()}`
      : "/dashboard/users";
    router.replace(url, { scroll: false });
  }, [page, search, roleFilter, router]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  // Fetch API
  const rolesArr = roleFilter !== "all" ? [roleFilter] : undefined;
  const { data, isLoading } = useSearchUsers(
    debouncedSearch,
    page,
    PAGE_SIZE,
    rolesArr,
  );

  const users = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const isFiltering = search !== debouncedSearch;

  // To build stats natively, since there's no endpoint, we approximate
  // using total from standard responses or just general place holders.
  const STAT_CARDS = [
    {
      label: "Total Users",
      value: isLoading ? "—" : roleFilter === "all" ? total : "...",
      icon: (
        <div
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#eef2ff" }}
        >
          <Users
            className="w-4 h-4 sm:w-5 sm:h-5"
            style={{ color: "#2b4bb9" }}
          />
        </div>
      ),
    },
    {
      label: "Vendors",
      value: isLoading ? "—" : roleFilter === "vendor" ? total : "...",
      icon: (
        <div
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#eef2ff" }}
        >
          <Store
            className="w-4 h-4 sm:w-5 sm:h-5"
            style={{ color: "#3730a3" }}
          />
        </div>
      ),
    },
    {
      label: "Customers",
      value: isLoading ? "—" : roleFilter === "customer" ? total : "...",
      icon: (
        <div
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#f0fdf4" }}
        >
          <Users
            className="w-4 h-4 sm:w-5 sm:h-5"
            style={{ color: "#15803d" }}
          />
        </div>
      ),
    },
    {
      label: "Admins & Staff",
      value: isLoading
        ? "—"
        : roleFilter === "admin" || roleFilter === "staff"
          ? total
          : "...",
      icon: (
        <div
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#fffbeb" }}
        >
          <ShieldCheck
            className="w-4 h-4 sm:w-5 sm:h-5"
            style={{ color: "#b45309" }}
          />
        </div>
      ),
    },
  ];

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--surface-container-lowest)" }}
    >
      <Topbar
        title="User Management"
        description="Manage platform users, roles, and permissions"
      />

      <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-6 max-w-screen-2xl mx-auto w-full">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {isLoading && users.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            : STAT_CARDS.map((stat, i) => (
                <Card
                  key={i}
                  className="rounded-2xl p-3.5 sm:p-5 flex flex-row items-center gap-3 sm:gap-4 overflow-hidden"
                  style={{
                    background: "#fff",
                    boxShadow: "0 1px 4px rgba(19,27,46,0.06)",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  {stat.icon}
                  <div className="min-w-0">
                    <p
                      className="text-[11px] sm:text-xs font-medium whitespace-normal sm:whitespace-nowrap leading-tight"
                      style={{ color: "#9ca3af" }}
                    >
                      {stat.label}
                    </p>
                    <p
                      className="text-base sm:text-xl font-bold mt-0.5 truncate"
                      style={{
                        color: "#0f172a",
                        fontFamily: "var(--font-display)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {stat.value}
                    </p>
                  </div>
                </Card>
              ))}
        </div>

        {/* Main Card with Search, Filters & Table */}
        <Card
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#fff",
            boxShadow: "0 1px 4px rgba(19,27,46,0.06)",
            border: "1px solid #f1f5f9",
          }}
        >
          {/* Header with Search & Filter */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid #f4f5ff" }}
          >
            <div>
              <h2 className="text-base font-bold" style={{ color: "#0f172a" }}>
                User Directory
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                {isLoading ? "..." : `${total} user${total !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-xl border-[#f1f5f9] bg-[#f8faff]">
                <Search
                  className="w-4 h-4 shrink-0"
                  style={{ color: "#9ca3af" }}
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="flex-1 text-sm bg-transparent border-0 shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-[#9ca3af]"
                  style={{ color: "#374151" }}
                />
                {isFiltering && (
                  <RefreshCw
                    className="w-3.5 h-3.5 animate-spin shrink-0"
                    style={{ color: "#9ca3af" }}
                  />
                )}
              </div>

              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="appearance-none pl-3.5 pr-9 py-2 rounded-xl text-sm font-medium outline-none transition-all border-[#f1f5f9] bg-[#f8faff] focus:ring-0 shadow-none"
                  style={{ color: "#374151" }}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="vendor">Vendors</option>
                  <option value="staff">Staff</option>
                  <option value="customer">Customers</option>
                </select>
                <ChevronDown
                  className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "#9ca3af" }}
                />
              </div>
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
                    "User",
                    "Contact Info",
                    "Roles",
                    "Joined Date",
                    "Actions",
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
                {isLoading && users.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableSkeletonRow
                      key={i}
                      cellWidths={[200, 150, 180, 120, 80]}
                    />
                  ))
                ) : users.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: "#f4f5ff" }}
                        >
                          <Users
                            className="w-6 h-6"
                            style={{ color: "#9ca3af" }}
                          />
                        </div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "#6b7280" }}
                        >
                          {debouncedSearch || roleFilter !== "all"
                            ? "No users match your filters"
                            : "No users found"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow
                      key={u.id}
                      style={{ borderBottom: "1px solid #f4f5ff" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#fafbff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <TableCell className="py-5 px-6 align-middle">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={
                              u.name ||
                              (u.email ? u.email.split("@")[0] : "Unknown")
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-semibold truncate"
                              style={{ color: "#0f172a" }}
                            >
                              {u.name || "Unknown User"}
                            </p>
                            <p
                              className="text-xs font-mono mt-0.5"
                              style={{ color: "#9ca3af" }}
                            >
                              ID: {u.id.split("-").shift()?.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-5 px-6 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <p
                            className="text-sm truncate"
                            style={{ color: "#374151" }}
                          >
                            {u.email}
                          </p>
                          {u.phone && (
                            <p
                              className="text-xs font-mono"
                              style={{ color: "#9ca3af" }}
                            >
                              {u.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-5 px-6 align-middle">
                        <div className="flex flex-wrap gap-2">
                          {u.roles?.map((r) => (
                            <RoleBadge key={r} role={r} />
                          )) ?? (
                            <span
                              className="text-xs"
                              style={{ color: "#9ca3af" }}
                            >
                              —
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-5 px-6 align-middle">
                        <span className="text-sm" style={{ color: "#6b7280" }}>
                          {u.createdAt
                            ? formatRelative(parseISO(u.createdAt), new Date())
                            : "—"}
                        </span>
                      </TableCell>

                      <TableCell className="py-5 px-6 align-middle">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex h-auto items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#eef2ff]"
                          style={{ color: "#2b4bb9" }}
                          onClick={() => {
                            toast.info("View user details coming soon.");
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && total > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
