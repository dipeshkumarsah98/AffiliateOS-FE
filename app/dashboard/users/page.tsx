"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { formatRelative, parseISO } from "date-fns";
import {
  Users,
  Store,
  ShieldCheck,
  Search,
  RefreshCw,
  ChevronDown,
  Eye,
  Plus,
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
import {
  StatsCards,
  type StatCardData,
} from "@/components/dashboard/StatsCards";
import { TableSkeletonRow } from "@/components/dashboard/TableSkeletonRow";
import { toast } from "sonner";
import RoleBadge from "@/components/common/RoleBadge";
import UserAvatar from "@/components/common/UserAvatar";
import { TablePagination } from "@/components/common/TablePagination";

// Dynamic import for code splitting
const UserDetailDialog = dynamic(
  () =>
    import("@/components/dashboard/users/UserDetailDialog").then(
      (mod) => mod.UserDetailDialog,
    ),
  {
    ssr: false,
  },
);

const PAGE_SIZE = 20;

export default function UserManagementPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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

  function handlePage(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }
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

  // Build stats cards with proper typing
  const statCards: StatCardData[] = [
    {
      label: "Total Users",
      value: isLoading ? "—" : roleFilter === "all" ? total : "...",
      icon: <Users />,
      iconBg: "#eef2ff",
      iconColor: "#2b4bb9",
    },
    {
      label: "Vendors",
      value: isLoading ? "—" : roleFilter === "vendor" ? total : "...",
      icon: <Store />,
      iconBg: "#eef2ff",
      iconColor: "#3730a3",
    },
    {
      label: "Customers",
      value: isLoading ? "—" : roleFilter === "customer" ? total : "...",
      icon: <Users />,
      iconBg: "#f0fdf4",
      iconColor: "#15803d",
    },
    {
      label: "Admins & Staff",
      value: isLoading
        ? "—"
        : roleFilter === "admin" || roleFilter === "staff"
          ? total
          : "...",
      icon: <ShieldCheck />,
      iconBg: "#fffbeb",
      iconColor: "#b45309",
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
        <StatsCards
          stats={statCards}
          isLoading={isLoading && users.length === 0}
          columns={4}
        />

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
            <div className="flex items-center justify-end gap-3 flex-1 flex-wrap sm:flex-nowrap">
              <div className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-xl border-[#f1f5f9] bg-[#f8faff] min-w-[200px] max-w-sm">
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

              <Button
                onClick={() => router.push("/dashboard/users/new")}
                className="gap-2 rounded-xl bg-[#2b4bb9] hover:bg-[#203a93]"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add User</span>
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
                    "User",
                    "Contact Info",
                    "Roles",
                    "Joined Date",
                    "Actions",
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
                          onClick={() => setSelectedUserId(u.id)}
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

          {!isLoading && totalPages > 1 && (
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

      <UserDetailDialog
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
