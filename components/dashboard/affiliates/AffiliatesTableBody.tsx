"use client";

import { getApiErrorMessage } from "@/lib/api/client";
import type { AffiliateListItem } from "@/lib/api/affiliates";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { TableSkeletonRow } from "@/components/dashboard/TableSkeletonRow";
import { AffiliateRow } from "./AffiliateRow";
import { AlertTriangle, Users, RefreshCw } from "lucide-react";

type AffiliatesTableBodyProps = {
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    affiliates: AffiliateListItem[];
    deferredSearch: string;
    pageSize: number;
    onRetry: () => void;
    onView: (affiliate: AffiliateListItem) => void;
    onEdit: (affiliate: AffiliateListItem) => void;
};

// 8 columns: Affiliate (name+email+product), Type, Code, Discount, Commission, Status, Joined, Actions
const SKELETON_CELL_WIDTHS = [180, 90, 110, 80, 80, 90, 100, 120];

type TableState = "loading" | "error" | "empty" | "data";

function resolveTableState(
    isLoading: boolean,
    isError: boolean,
    affiliatesLength: number,
): TableState {
    if (isLoading) return "loading";
    if (isError) return "error";
    if (affiliatesLength === 0) return "empty";
    return "data";
}

export function AffiliatesTableBody({
    isLoading,
    isError,
    error,
    affiliates,
    deferredSearch,
    pageSize,
    onRetry,
    onView,
    onEdit,
}: AffiliatesTableBodyProps) {
    const state = resolveTableState(isLoading, isError, affiliates.length);

    if (state === "loading") {
        return Array.from({ length: pageSize }).map((_, i) => (
            <TableSkeletonRow key={`loading-${i}`} cellWidths={SKELETON_CELL_WIDTHS} />
        ));
    }

    if (state === "error") {
        return (
            <TableRow>
                <TableCell colSpan={8} className="py-16 text-center px-6">
                    <AlertTriangle
                        className="w-10 h-10 mx-auto mb-3 opacity-40"
                        style={{ color: "#dc2626" }}
                    />
                    <p className="text-sm font-semibold mb-1" style={{ color: "#0f1623" }}>
                        Unable to load affiliates
                    </p>
                    <p className="text-sm mb-4" style={{ color: "#9ca3af" }}>
                        {getApiErrorMessage(error, "Affiliate list request failed.")}
                    </p>
                    <Button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                        style={{ background: "#eef2ff", color: "#2b4bb9" }}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </Button>
                </TableCell>
            </TableRow>
        );
    }

    if (state === "empty") {
        return (
            <TableRow>
                <TableCell colSpan={8} className="py-20 text-center">
                    <Users
                        className="w-10 h-10 mx-auto mb-3 opacity-20"
                        style={{ color: "#9ca3af" }}
                    />
                    <p className="text-sm" style={{ color: "#9ca3af" }}>
                        {deferredSearch
                            ? "No affiliates match your search"
                            : "No affiliates found"}
                    </p>
                </TableCell>
            </TableRow>
        );
    }

    return (
        <>
            {affiliates.map((affiliate) => (
                <AffiliateRow
                    key={affiliate.id}
                    affiliate={affiliate}
                    onView={() => onView(affiliate)}
                    onEdit={() => onEdit(affiliate)}
                />
            ))}

        </>
    );
}
