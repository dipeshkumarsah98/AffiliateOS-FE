"use client";

import { Edit2, Eye } from "lucide-react";
import type { AffiliateListItem } from "@/lib/api/affiliates";
import {
    AFFILIATE_TYPE_LABELS,
    AFFILIATE_TYPE_COLORS,
} from "./helpers";
import { Badge } from "@/components/ui/badge";

interface AffiliateRowProps {
    affiliate: AffiliateListItem;
    onEdit: (affiliate: AffiliateListItem) => void;
    onView: (affiliate: AffiliateListItem) => void;
}

export function AffiliateRow({ affiliate, onEdit, onView }: AffiliateRowProps) {
    const typeKey = affiliate.vendor.extras.affiliateType;
    const typeColor = AFFILIATE_TYPE_COLORS[typeKey] ?? "blue";
    const typeLabel = AFFILIATE_TYPE_LABELS[typeKey] ?? typeKey;

    return (
        <tr
            style={{ borderBottom: "1px solid #f4f5ff" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fafbff")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
            {/* Affiliate name + email + product */}
            <td className="py-5 px-6">
                <div className="flex items-center gap-3.5">
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{
                            background: "var(--primary-fixed)",
                            color: "var(--on-primary-fixed)",
                        }}
                    >
                        {affiliate.vendor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                            {affiliate.vendor.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                            {affiliate.vendor.email}
                        </p>
                        {affiliate.product && (
                            <p className="text-xs mt-0.5 font-medium" style={{ color: "#6366f1" }}>
                                {affiliate.product.title}
                            </p>
                        )}
                    </div>
                </div>
            </td>

            {/* Type badge */}
            <td className="py-5 px-6">
                <Badge variant={typeColor as any} className="text-xs font-semibold">
                    {typeLabel}
                </Badge>
            </td>

            {/* Affiliate code */}
            <td className="py-5 px-6">
                <span
                    className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: "#eef2ff", color: "#2b4bb9" }}
                >
                    {affiliate.code}
                </span>
            </td>

            {/* Discount */}
            <td className="py-5 px-6">
                <span className="text-sm tabular-nums" style={{ color: "#374151" }}>
                    {affiliate.discountType === "PERCENTAGE"
                        ? `${affiliate.discountValue}%`
                        : `$${affiliate.discountValue}`}
                </span>
            </td>

            {/* Commission */}
            <td className="py-5 px-6">
                <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: "#16a34a" }}
                >
                    {affiliate.commissionType === "PERCENTAGE"
                        ? `${affiliate.commissionValue}%`
                        : `$${affiliate.commissionValue}`}
                </span>
            </td>

            {/* Status dot-pill */}
            <td className="py-5 px-6">
                <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={
                        affiliate.isActive
                            ? { background: "#f0fdf4", color: "#15803d" }
                            : { background: "#f4f5ff", color: "#6b7280" }
                    }
                >
                    <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: affiliate.isActive ? "#22c55e" : "#9ca3af" }}
                    />
                    {affiliate.isActive ? "Active" : "Inactive"}
                </span>
            </td>

            {/* Joined date */}
            <td className="py-5 px-6">
                <span className="text-sm" style={{ color: "#6b7280" }}>
                    {new Date(affiliate.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                </span>
            </td>

            {/* Actions — View and Edit only (no Delete as per requirements) */}
            <td className="py-5 px-6">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onView(affiliate)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#eef2ff]"
                        style={{ color: "#2b4bb9" }}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        View
                    </button>
                    <button
                        onClick={() => onEdit(affiliate)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#f4f5ff]"
                        style={{ color: "#6b7280" }}
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                    </button>
                </div>
            </td>
        </tr>
    );
}
