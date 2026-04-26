"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  DollarSign,
  ShieldCheck,
  User,
  X,
  Banknote,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: ClipboardList,
    roles: ["admin"],
  },
  {
    label: "COD Verification",
    href: "/dashboard/cod-verifications",
    icon: ClipboardList,
    roles: ["admin"],
  },
  {
    label: "Products",
    href: "/dashboard/products",
    icon: Package,
    roles: ["admin"],
  },
  {
    label: "Affiliates",
    href: "/dashboard/affiliates",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "User Management",
    href: "/dashboard/users",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
    label: "Withdrawals",
    href: "/dashboard/withdrawals",
    icon: Banknote,
    roles: ["admin"],
  },
  {
    label: "Earnings",
    href: "/dashboard/earnings",
    icon: DollarSign,
    roles: ["vendor"],
  },
  {
    label: "Withdrawals",
    href: "/dashboard/my-withdrawals",
    icon: Banknote,
    roles: ["vendor"],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const currentUser = useAuthStore((s) => s.currentUser);
  const roles = currentUser?.roles ?? [];

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.some((r) => roles.includes(r as never)),
  );

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Khatriin Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <p
              className="text-sm font-bold tracking-tight"
              style={{
                color: "var(--on-surface)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
              }}
            >
              Khatriin
            </p>
            <p
              className="text-[10px]"
              style={{ color: "var(--on-surface-variant)" }}
            >
              {roles.includes("admin") ? "Admin Panel" : "Vendor Portal"}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-container-high)]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-white"
                  : "hover:bg-[var(--surface-container-high)]",
              )}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(135deg, #D60B47 0%, #e63468 100%)",
                      color: "white",
                    }
                  : { color: "var(--on-surface-variant)" }
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div
        className="mx-4 my-2"
        style={{ borderTop: "1px solid rgba(195,197,220,0.3)" }}
      />

      {/* Bottom items */}
      <div className="px-3 pb-4 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-white"
                  : "hover:bg-[var(--surface-container-high)]",
              )}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(135deg, #D60B47 0%, #e63468 100%)",
                      color: "white",
                    }
                  : { color: "var(--on-surface-variant)" }
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col z-30"
        style={{ background: "var(--surface-container-low)" }}
      >
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{
            background: "rgba(19,27,46,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={onClose}
        />
      )}

      {/* Mobile drawer panel */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 h-screen w-72 z-50 flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ background: "var(--surface-container-low)" }}
      >
        {content}
      </aside>
    </>
  );
}
