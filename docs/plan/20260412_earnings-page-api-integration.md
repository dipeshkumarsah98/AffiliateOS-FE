# Earnings Page — API Integration Plan

**Date:** 2026-04-12  
**Page:** `app/dashboard/earnings/page.tsx`  
**API Endpoints:**

- List: `GET /vendors/commissions?page=1&limit=20&sortBy=totalCommission&sortOrder=desc&isActive=true`
- Summary: `GET /vendors/commissions/summary`

**Access:** Vendor-only

---

## Summary

The earnings page currently uses dummy data (`DUMMY_EARNINGS`, `DUMMY_WITHDRAWALS`, `DUMMY_AFFILIATES`) and stat cards modeled around individual order commissions with a built-in withdrawal modal. The real API returns a **product-level commission summary** (total commission per affiliate link/product, not per-order), so the page's data model, stat cards, and table must be redesigned to match the actual API shape. The withdrawal functionality should also be removed from this page since it already exists in the dedicated `my-withdrawals` page.

The API also provides a dedicated **summary endpoint** (`GET /vendors/commissions/summary`) for accurate aggregate stats, and supports **sorting** (by `totalCommission`, `orderCount`, `lastOrderDate`, `code`) and **filtering** (by `isActive`). Clicking a table row opens a **detail modal** (no separate detail API — uses the list data) showing commission type/value, discount info, and other contextual details.

---

## API Response Shape

```ts
interface CommissionProduct {
  id: string;
  title: string;
  slug: string;
  images: string[];
  price: number;
}

interface CommissionItem {
  affiliateLinkId: string;
  code: string;
  product: CommissionProduct;
  totalCommission: number;
  totalOrders: number;
  completedOrders: number;
  lastCompletedOrderDate: string;
  commissionType: "PERCENTAGE" | "FIXED";
  commissionValue: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  isActive: boolean;
  createdAt: string;
}

interface CommissionsResponse {
  items: CommissionItem[];
  total: number;
  page: number;
  limit: number;
}
```

### Summary Endpoint — `GET /vendors/commissions/summary`

```ts
interface CommissionSummary {
  totalCommission: number; // e.g. 229.1
  activeLinks: number; // e.g. 2
  totalOrders: number; // e.g. 2
  completedOrders: number; // e.g. 2
}
```

### Query Params (Sorting & Filtering)

```ts
// Backend validation schema (for reference)
VendorCommissionQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(["totalCommission", "orderCount", "lastOrderDate", "code"])
    .optional()
    .default("totalCommission"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  isActive: z.coerce.boolean().optional(),
});
```

---

## Stat Cards — Rethinking for this Page

### Problem with current stats

The current earnings page shows: **Total Earned**, **Available Balance**, **Pending**, **Total Withdrawn**. These are withdrawal-focused stats and duplicate what `my-withdrawals` already displays. The API response is product-level commission data, so the stats should reflect _commission performance_, not withdrawal balance.

### Proposed stat cards (from `GET /vendors/commissions/summary`)

| #   | Label                | Value   | Source                    | Icon           |
| --- | -------------------- | ------- | ------------------------- | -------------- |
| 1   | **Total Commission** | `NPR X` | `summary.totalCommission` | `DollarSign`   |
| 2   | **Active Links**     | `N`     | `summary.activeLinks`     | `LinkIcon`     |
| 3   | **Total Orders**     | `N`     | `summary.totalOrders`     | `ShoppingCart` |
| 4   | **Completed Orders** | `N`     | `summary.completedOrders` | `CheckCircle`  |

Stats come from the dedicated summary endpoint, so they always reflect accurate global totals regardless of pagination.

---

## Implementation Steps

### Step 1: Create API layer — `lib/api/commissions.ts`

Create the typed API functions following the established pattern in `lib/api/withdrawals.ts`:

```ts
// lib/api/commissions.ts
import { apiClient } from "./client";

export interface CommissionProduct {
  id: string;
  title: string;
  slug: string;
  images: string[];
  price: number;
}

export interface CommissionItem {
  affiliateLinkId: string;
  code: string;
  product: CommissionProduct;
  totalCommission: number;
  totalOrders: number;
  completedOrders: number;
  lastCompletedOrderDate: string;
  commissionType: "PERCENTAGE" | "FIXED";
  commissionValue: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  isActive: boolean;
  createdAt: string;
}

export type CommissionSortBy =
  | "totalCommission"
  | "orderCount"
  | "lastOrderDate"
  | "code";
export type SortOrder = "asc" | "desc";

export interface GetCommissionsParams {
  page: number;
  limit: number;
  sortBy?: CommissionSortBy;
  sortOrder?: SortOrder;
  isActive?: boolean;
}

export interface GetCommissionsResponse {
  items: CommissionItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CommissionSummary {
  totalCommission: number;
  activeLinks: number;
  totalOrders: number;
  completedOrders: number;
}

export async function getCommissions(params: GetCommissionsParams) {
  const response = await apiClient.get<GetCommissionsResponse>(
    "/vendors/commissions",
    {
      params: {
        page: params.page,
        limit: params.limit,
        ...(params.sortBy ? { sortBy: params.sortBy } : {}),
        ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
        ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      },
    },
  );
  return response.data;
}

export async function getCommissionSummary() {
  const response = await apiClient.get<CommissionSummary>(
    "/vendors/commissions/summary",
  );
  return response.data;
}
```

### Step 2: Add query key and hook — `hooks/use-commissions.ts`

Follow the pattern from `hooks/use-withdrawals.ts`:

1. Add `commissions: createQueryKeys("commissions")` to `queryKeys` in `hooks/use-query.ts`.
2. Create `hooks/use-commissions.ts`:

```ts
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getCommissions,
  getCommissionSummary,
  type GetCommissionsParams,
} from "@/lib/api/commissions";
import { queryKeys } from "@/hooks/use-query";

export function useCommissionsQuery(params: GetCommissionsParams) {
  return useQuery({
    queryKey: queryKeys.commissions.list({
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy ?? "",
      sortOrder: params.sortOrder ?? "",
      isActive: params.isActive ?? "",
    }),
    queryFn: () => getCommissions(params),
    placeholderData: keepPreviousData,
  });
}

export function useCommissionSummaryQuery() {
  return useQuery({
    queryKey: [...queryKeys.commissions.all(), "summary"],
    queryFn: () => getCommissionSummary(),
  });
}
```

### Step 3: Rewrite `app/dashboard/earnings/page.tsx`

Major changes:

1. **Remove all dummy data imports** (`DUMMY_EARNINGS`, `DUMMY_WITHDRAWALS`, `DUMMY_AFFILIATES`).
2. **Remove `USER_TO_AFFILIATE` mapping** — no longer needed.
3. **Remove `WithdrawModal` component** — withdrawals live at `/dashboard/my-withdrawals`.
4. **Remove the withdrawal button** and pending withdrawal alert (duplicated from my-withdrawals).
5. **Replace stat cards** with the 4 new commission-focused stats from the summary endpoint (Total Commission, Active Links, Total Orders, Completed Orders).
6. **Replace table columns** to match the new API (keep table lean — details go in modal):
   - Product (image thumbnail + title)
   - Affiliate Code
   - Orders (completed/total)
   - Total Commission
   - Last Completed Date
   - Status (active/inactive badge)
   - Action button (eye icon → opens detail modal)
7. **Add `CommissionDetailModal`** — opens when clicking a row or the action button. Displays all info from the list item:
   - Product image, title, price
   - Affiliate code
   - Commission type + value (e.g., "2% per order" or "NPR 50 flat")
   - Discount type + value offered to customers
   - Order stats (total/completed)
   - Last completed order date
   - Active/inactive status
   - Created date
8. **Add sorting** — sort dropdown or clickable column headers for `totalCommission`, `orderCount`, `lastOrderDate`, `code`.
9. **Add filtering** — active/inactive filter dropdown (maps to `isActive` query param).
10. **Add pagination** — reuse the `WithdrawalsPagination` component pattern or create a generic `Pagination` component.
11. **Add loading states** — use `StatCardSkeleton` for stat cards and `TableSkeletonRow` for table.
12. **Add empty state** similar to existing pattern.
13. **Add URL-synced pagination + filters** using `useSearchParams` + `useRouter` (same pattern as my-withdrawals page). Sync `page`, `sortBy`, `sortOrder`, and `isActive` to URL.

### Step 4: Table columns (lean — details in modal)

| Column         | Source                                                    | Notes                                |
| -------------- | --------------------------------------------------------- | ------------------------------------ |
| Product        | `item.product.title` + `item.product.images[0]` thumbnail | Show product image + title           |
| Affiliate Code | `item.code`                                               | Styled code badge                    |
| Orders         | `item.completedOrders` / `item.totalOrders`               | e.g., "1/1"                          |
| Total Earned   | `item.totalCommission`                                    | Green, formatted NPR                 |
| Last Completed | `item.lastCompletedOrderDate`                             | Formatted date, "—" if null          |
| Status         | `item.isActive`                                           | Active/Inactive badge                |
| Action         | —                                                         | Eye icon button → opens detail modal |

### Step 5: `CommissionDetailModal` component

Opens when clicking a row or the action button. Uses the `CommissionItem` from list data (no extra API call). Follows the `DetailModal` pattern from `my-withdrawals/page.tsx`.

**Modal content sections:**

1. **Header** — Product title + affiliate code subtitle + close button
2. **Product card** — Product image, title, base price
3. **Commission info** — Two-column grid:
   - Commission Type: "Percentage" or "Fixed"
   - Commission Value: "2%" or "NPR 50"
   - Discount Type: "Percentage" or "Fixed"
   - Discount Value: "2%" or "NPR 50"
4. **Performance stats** — Two-column grid:
   - Total Orders: `item.totalOrders`
   - Completed Orders: `item.completedOrders`
   - Total Commission Earned: `NPR item.totalCommission`
   - Last Completed: formatted date or "—"
5. **Status + dates** — Active/Inactive badge + "Created on" date
6. **Close button** at the bottom

### Step 6: Replace `EarningsBadge` with `StatusBadge`

The old `EarningsBadge` showed `pending`/`paid` per-earning status. Replace with a simple **Active/Inactive badge** for the affiliate link status.

### Step 7: Sorting & filtering toolbar

Above the table, add:

- **Sort dropdown**: Options map to `sortBy` values — "Commission" (`totalCommission`), "Orders" (`orderCount`), "Last Order" (`lastOrderDate`), "Code" (`code`). Default: `totalCommission desc`.
- **Sort order toggle**: asc/desc button (arrow icon).
- **Active filter dropdown**: "All", "Active", "Inactive" — maps to `isActive` param (omitted for "All", `true` for "Active", `false` for "Inactive").

---

## Edge Cases to Handle

1. **Empty state**: Vendor has no affiliate links / commissions yet — show an empty state with appropriate messaging (e.g., "No commissions yet. Start sharing your affiliate links to earn.")
2. **Null `lastCompletedOrderDate`**: If a link has `totalOrders > 0` but `completedOrders === 0`, `lastCompletedOrderDate` could be null. Display "—" or "No completed orders".
3. **Inactive links**: Some links may be `isActive: false`. They should still display in the table but with a muted/inactive badge.
4. **Commission formatting**: Handle both `PERCENTAGE` and `FIXED` types — display "2%" vs "NPR 50".
5. **Product images**: The `images` array could be empty — provide a fallback placeholder image.
6. **Pagination boundary**: Handle when `total` is 0 (hide pagination) or when page exceeds total pages.
7. **Loading state**: Show skeleton UI while commission data is loading (stat card skeletons + table row skeletons).
8. **Error state**: Show error message if the API call fails (follow existing error patterns).
9. **Non-vendor access**: Keep the existing redirect for non-vendor users (redirect to `/dashboard`).

---

## Resolved Questions

1. ~~**Summary endpoint**~~ — **Confirmed.** `GET /vendors/commissions/summary` exists and returns `{ totalCommission, activeLinks, totalOrders, completedOrders }`.
2. ~~**Discount column**~~ — **Resolved.** Discount info is shown in the detail modal only, not in the table.
3. ~~**Sorting/filtering**~~ — **Confirmed.** API supports `sortBy` (totalCommission, orderCount, lastOrderDate, code), `sortOrder` (asc, desc), and `isActive` (boolean) query params.
4. ~~**Link to product page**~~ — **Resolved.** Clicking a row opens a detail modal (using list data) — no navigation to another page.

## Open Questions

_(None at this time.)_

---

## Files to Create/Modify

| File                              | Action                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/api/commissions.ts`          | **Create** — Types + `getCommissions()` + `getCommissionSummary()` API functions                                                                                                      |
| `hooks/use-commissions.ts`        | **Create** — `useCommissionsQuery()` + `useCommissionSummaryQuery()` hooks                                                                                                            |
| `hooks/use-query.ts`              | **Modify** — Add `commissions` to `queryKeys`                                                                                                                                         |
| `app/dashboard/earnings/page.tsx` | **Modify** — Full rewrite: remove dummy data, withdraw modal, old stat cards; integrate API, new stats, lean table, detail modal, sorting/filtering, pagination, loading/error states |

---

## Patterns to Follow

- **API layer**: Mirror `lib/api/withdrawals.ts` structure
- **Hook**: Mirror `hooks/use-withdrawals.ts` structure
- **Query keys**: Use `queryKeys.commissions.list({ page, limit, sortBy, sortOrder, isActive })` via factory
- **Summary query**: Use `[...queryKeys.commissions.all(), "summary"]` (same pattern as withdrawal balance)
- **Loading**: Use `StatCardSkeleton` + `TableSkeletonRow` components
- **Pagination**: URL-synced pagination using `useSearchParams` (my-withdrawals pattern)
- **Detail modal**: Follow `DetailModal` pattern from my-withdrawals (same Dialog structure, inline data, no extra API call)
- **Sorting/filtering**: Sync to URL params, pass to query hook
- **Imports**: Follow the project import order (React → third-party → components → lib/hooks → stores → constants → types)
