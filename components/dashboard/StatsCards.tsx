import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import StatCardSkeleton from "@/components/common/StatCardSkeleton";

// ── Types ────────────────────────────────────────────────────────────────────

export interface StatCardData {
  /** Display label for the stat */
  label: string;
  /** Value to display (can be string or number) */
  value: string | number;
  /** Icon element to display */
  icon: ReactNode;
  /** Background color for the icon container (hex or CSS color) */
  iconBg?: string;
  /** Color for the icon itself (hex or CSS color) */
  iconColor?: string;
}

export interface StatsCardsProps {
  /** Array of stat card configurations */
  stats: StatCardData[];
  /** Loading state - shows skeleton loaders when true */
  isLoading?: boolean;
  /** Number of columns on large screens (default: 4) */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Custom class name for the grid container */
  className?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function StatsCards({
  stats,
  isLoading = false,
  columns = 4,
  className = "",
}: StatsCardsProps) {
  const gridColsClass = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  }[columns];

  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-2 ${gridColsClass} gap-3 md:gap-4 ${className}`}
      >
        {Array.from({ length: stats.length || 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 ${gridColsClass} gap-3 md:gap-4 ${className}`}
    >
      {stats.map((stat, i) => (
        <Card
          key={i}
          className="rounded-2xl p-3.5 sm:p-5 flex flex-row items-center gap-3 sm:gap-4 overflow-hidden"
          style={{
            background: "#fff",
            boxShadow: "0 1px 4px rgba(19,27,46,0.06)",
            border: "1px solid #f1f5f9",
          }}
        >
          {/* Icon Container */}
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: stat.iconBg || "#eef2ff",
            }}
          >
            <div
              className="w-4 h-4 sm:w-5 sm:h-5 [&>svg]:w-full [&>svg]:h-full"
              style={{ color: stat.iconColor || "#2b4bb9" }}
            >
              {stat.icon}
            </div>
          </div>

          {/* Content */}
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
  );
}
