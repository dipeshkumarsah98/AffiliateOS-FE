# Order Detail Page — Implementation Plan

**Date:** 2026-04-03
**Route:** `/dashboard/orders/[id]`

## Summary

Build a full-page order detail view at `app/dashboard/orders/[id]/page.tsx` that fetches a single order via `GET /orders/:id` and displays all order information: header with status + order number, customer info, items table, pricing breakdown, shipping/billing addresses, payment details, affiliate/earnings info, verification status, and an order journey timeline. Admin users get a **"Update Status"** button that opens a dialog to advance or change the order status. The response type (`OrderDetailResponse`) differs from the existing `Order` type in `lib/types.ts` and the list-level `OrderListItem`, so a new interface must be created. A hardcoded `statuses` array simulates the status-history timeline until the backend provides it.

---

## Implementation Steps

### 1. Define the `OrderDetailResponse` type

**File:** `lib/api/orders.ts` (add to existing file)

Add a new interface matching the actual API response:

```ts
export interface OrderDetailProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  totalStock: number;
  status: string;
  updatedAt: string;
  createdAt: string;
}

export interface OrderDetailItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: OrderDetailProduct;
}

export interface OrderAddress {
  id: string;
  userId: string;
  addressType: "shipping" | "billing";
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  isDefault: boolean;
  createdAt: string;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  paymentMethod: string;
  provider: string;
  amount: number;
  currency: string;
  transactionId: string | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export interface OrderVerification {
  id: string;
  orderId: string;
  verifiedBy: string | null;
  verificationStatus: string;
  customerResponse: string | null;
  remarks: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface OrderEarning {
  id: string;
  orderId: string;
  affiliateId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface OrderStatusEntry {
  status: string;
  createdAt: string;
  createdBy: string | null;
}

export interface OrderDetailResponse {
  id: string;
  userId: string;
  orderNumber: string;
  status: string;
  affiliateId: string | null;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingAddressId: string;
  billingAddressId: string;
  paymentMethod: string;
  notes: string | null;
  updatedAt: string;
  createdAt: string;
  createdBy: string | null;
  items: OrderDetailItem[];
  user: { email: string; name: string };
  payment: OrderPayment | null;
  verification: OrderVerification | null;
  earnings: OrderEarning[];
  affiliate: { id: string; fullName: string; affiliateCode: string } | null;
  shippingAddress: OrderAddress | null;
  billingAddress: OrderAddress | null;
  statuses?: OrderStatusEntry[]; // future — hardcode for now
}
```

### 2. Update the API function

**File:** `lib/api/orders.ts`

Update `fetchOrderDetails` to return the new type:

```ts
export async function fetchOrderDetails(
  id: string,
): Promise<OrderDetailResponse> {
  const { data: res } = await apiClient.get<OrderDetailResponse>(
    `/orders/${id}`,
  );
  return res;
}
```

> **Confirmed:** The API returns the order object directly (no `{ order: ... }` wrapper). The existing `fetchOrderDetails` must be updated to remove the `.order` unwrap.

Add a new function for status updates:

```ts
export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<OrderDetailResponse> {
  const { data } = await apiClient.patch<OrderDetailResponse>(
    `/orders/${orderId}/status`,
    { status },
  );
  return data;
}
```

> **Confirmed:** `PATCH /orders/:id/status` with body `{ status: "PROCESSING" }`. Valid status values: `'PENDING' | 'VERIFIED' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'`.

### 3. Add query hook for order detail + mutation for status update

**File:** `hooks/use-orders.ts` (extend existing file)

```ts
import { fetchOrderDetails, updateOrderStatus } from "@/lib/api/orders";

export function useOrderDetailQuery(id: string) {
  return useQuery({
    queryKey: [...queryKeys.orders.detail(id)],
    queryFn: () => fetchOrderDetails(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  return useApiMutation<
    OrderDetailResponse,
    { orderId: string; status: string }
  >({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    invalidateKeys: [
      [...queryKeys.orders.all()], // invalidate list + detail
    ],
    onSuccess: () => {
      toast.success("Order status updated");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update status",
      );
    },
  });
}
```

### 4. Build the Order Detail page

**File:** `app/dashboard/orders/[id]/page.tsx`

This is a `'use client'` page (needs `useParams`, hooks, interactivity).

#### Page structure (top-down):

```
┌─────────────────────────────────────────────────────┐
│ Topbar (breadcrumb: Orders > #ORD-XcCv…)            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ HEADER ──────────────────────────────────────┐  │
│  │  Order #ORD-XcCv0okyGVE1   StatusPill         │  │
│  │  Placed on Apr 3, 2026     [Update Status ▼]  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────┐  ┌─────────────────────┐  │
│  │  LEFT COLUMN (2/3)   │  │ RIGHT COLUMN (1/3)  │  │
│  │                      │  │                     │  │
│  │  📦 Items Table      │  │  Order Journey      │  │
│  │  (img, title, qty,   │  │  (vertical timeline) │  │
│  │   unit, total)       │  │                     │  │
│  │                      │  │  Payment Info       │  │
│  │  Pricing Breakdown   │  │  (method, status,   │  │
│  │  (sub, tax, ship,    │  │   provider, txn ID) │  │
│  │   discount, total)   │  │                     │  │
│  │                      │  │  Customer Info      │  │
│  │  Shipping Address    │  │  (name, email)      │  │
│  │  Billing Address     │  │                     │  │
│  │                      │  │  Verification       │  │
│  │  Notes (if present)  │  │  (status, response, │  │
│  │                      │  │   remarks, who,     │  │
│  │                      │  │   when)             │  │
│  │                      │  │                     │  │
│  │                      │  │  Affiliate (if any) │  │
│  └──────────────────────┘  └─────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Components to extract (inside `components/dashboard/orders/`):

| Component                   | Purpose                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `OrderDetailHeader.tsx`     | Order number, date, status pill, "Update Status" button                                                  |
| `OrderItemsTable.tsx`       | Items list with product image (from `images[0]`), title, qty, unit price, total                          |
| `OrderPricingBreakdown.tsx` | Subtotal, tax, shipping, discount, total with currency label                                             |
| `OrderAddressCard.tsx`      | Reusable card for shipping/billing address display                                                       |
| `OrderTimeline.tsx`         | Vertical timeline (reuse pattern from `OrderDetailModal`) — driven by hardcoded `statuses` array for now |
| `OrderPaymentCard.tsx`      | Payment method, provider, status, amount, transaction ID, paid date                                      |
| `OrderCustomerCard.tsx`     | Customer name and email                                                                                  |
| `UpdateStatusDialog.tsx`    | Dialog with a Select dropdown for new status + confirm button                                            |
| `OrderVerificationCard.tsx` | Shows verification status, customer response, remarks, who verified, when verified                       |

### 5. Hardcoded status history (temporary)

Inside the page component or `OrderTimeline.tsx`, generate a synthetic status array:

```ts
const ORDERED_STATUSES = [
  "PENDING",
  "AWAITING_VERIFICATION",
  "VERIFIED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
];

function buildHardcodedStatuses(
  currentStatus: string,
  createdAt: string,
): OrderStatusEntry[] {
  const entries: OrderStatusEntry[] = [];
  for (const s of ORDERED_STATUSES) {
    entries.push({ status: s, createdAt, createdBy: null });
    if (s.toLowerCase() === currentStatus.toLowerCase()) break;
  }
  return entries;
}
```

When the backend ships the `statuses` field, swap this out for `order.statuses`.

### 6. Update Status Dialog

**File:** `components/dashboard/orders/UpdateStatusDialog.tsx`

- A `Dialog` containing a `Select` with status options (exclude the current status from selectable values).
- On confirm, calls the `useUpdateOrderStatus` mutation.
- Only visible to **admin** users (`currentUser.roles.includes("admin")`).
- Status transitions (admin can move forward or cancel):
  - `PENDING` → `AWAITING_VERIFICATION`, `CANCELLED`
  - `AWAITING_VERIFICATION` → `VERIFIED`, `CANCELLED` _(admin calls customer, verifies the COD order)_
  - `VERIFIED` → `PROCESSING`, `CANCELLED`
  - `PROCESSING` → `SHIPPED`, `CANCELLED`
  - `SHIPPED` → `COMPLETED`
  - `COMPLETED` → (no further transitions)
  - `CANCELLED` → (no further transitions)

### 7. Navigation from orders list

In `app/dashboard/orders/page.tsx`:

- **Row click** → opens the existing `OrderDetailModal` (quick preview, no change)
- **Explicit "View Details" button** inside the modal or as a row action → navigates to `/dashboard/orders/${order.id}` (full page)

Add a "View Full Details" button to `OrderDetailModal` that calls `router.push(`/dashboard/orders/${order.id}`)` and closes the dialog.

### 8. Back navigation

In the detail page header, include a **← Back to Orders** link (`<Link href="/dashboard/orders">`) for easy return.

---

## Edge Cases to Handle

1. **Order not found / 404**: If `fetchOrderDetails` throws a 404, show a `notFound()` or a friendly "Order not found" state with a link back to the orders list.
2. **Loading state**: Show a skeleton layout (reuse `Skeleton` from `@/components/ui/skeleton`) matching the page structure while the query loads.
3. **Error state**: Show an error card with a "Retry" button that calls `refetch()`.
4. **Cancelled order**: The timeline should visually indicate cancellation (red/crossed-out). The "Update Status" button should be hidden for terminal states (`COMPLETED`, `CANCELLED`).
5. **No affiliate / no verification / no earnings**: These sections should be conditionally rendered — only show when data is present.
6. **Currency formatting**: Use `order.currency` (e.g. `"NPR"`) — format amounts with `Intl.NumberFormat` or a utility that respects the currency. Don't hardcode `$`.
7. **Empty items array**: Defensive guard, though it shouldn't happen.
8. **Null addresses**: `shippingAddress` or `billingAddress` could theoretically be null. Show "No address on file" fallback.
9. **Product images**: The `images` array may be empty. Show a fallback icon (the `Package` icon from the modal) if no image is available.
10. **Status update race condition**: Disable the "Update" button while the mutation is pending (`isPending`). Invalidate the order detail query on success so the UI reflects the new status immediately.
11. **Vendor vs Admin**: Vendors should see the order detail but NOT the "Update Status" button. Gate it with `currentUser.roles.includes("admin")`.
12. **StatusPill update**: The existing `StatusPill` component needs a new entry for `VERIFIED` status (it currently only handles `pending`, `awaiting_verification`, `processing`, `shipped`, `completed`, `cancelled`). Add `verified` with a green/teal style.
13. **COD verification flow context**: When `paymentMethod === "COD"`, the order starts as `AWAITING_VERIFICATION`. Admin calls the customer, then verifies. On verification, the `verification` object is populated and status moves to `PROCESSING`. The verification card should explain this flow visually.

---

## Resolved Questions

1. **Update status endpoint**: `PATCH /orders/:id/status` with body `{ status: "PROCESSING" }`. Valid values: `PENDING | VERIFIED | PROCESSING | SHIPPED | COMPLETED | CANCELLED`.
2. **Status history**: Hardcoded for now. Timeline component designed to accept real `statuses` array with minimal future changes.
3. **Response wrapper**: API returns the order object directly (no nesting). `fetchOrderDetails` must drop the `.order` unwrap.
4. **additionalInfo**: Ignored — not displayed.
5. **Verification section**: Confirmed structure: `{ id, orderId, verifiedBy, verificationStatus, customerResponse, remarks, verifiedAt, createdAt }`. Shown when present. Explains the COD verification flow (admin calls customer → `AWAITING_VERIFICATION` → `VERIFIED`/`PROCESSING`).
6. **Navigation**: Row click → modal (quick preview). Explicit button in modal → full detail page.
