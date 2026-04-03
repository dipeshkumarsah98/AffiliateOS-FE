# Plan: Existing Customer Selection for Create Order Page

**Date:** 2026-04-04  
**Scope:** `app/dashboard/orders/new/page.tsx`, `app/dashboard/orders/new/review/page.tsx`, API layer, hooks, order-form-store

## Summary

The Create Order page currently requires manually entering customer details (name, email, phone) and addresses. This plan adds the ability to **search and select an existing customer** via the `GET /users?search=&page=&perPage=` API, auto-populating contact info and offering their saved addresses for shipping/billing. Users retain the ability to enter a new customer or override addresses with custom input. The review page must also adapt to show whether an existing user/address was used.

---

## Implementation Steps

### 1. Add User Search API Function

**File:** `lib/api/users.ts` (new file)

- Define types matching the API response:
  ```
  UserAddress { id, addressType ("shipping"|"billing"), street_address, city, state, postal_code, isDefault }
  UserSearchItem { id, email, name, phone, roles, createdAt, addresses: UserAddress[] }
  SearchUsersParams { search: string, page?: number, perPage?: number }
  SearchUsersResponse { items: UserSearchItem[], total, page, perPage, search }
  ```
- Implement `searchUsers(params: SearchUsersParams): Promise<SearchUsersResponse>` using `apiClient.get("/users", { params })`.

### 2. Add User Search Hook

**File:** `hooks/use-users.ts` (new file)

- Create `useSearchUsers(search: string, page?: number, perPage?: number)` hook using `useQuery`.
- Query key: `queryKeys.users.list({ search, page, perPage })` (the `users` key factory already exists in `use-query.ts`).
- Use `enabled: search.trim().length > 0` so it only fires when there's search input.
- Use `keepPreviousData` for smooth UX while typing.
- Use `useDebounce` from `hooks/use-debounce.ts` to debounce search input (the debounce should be done in the consuming component, not in the hook itself, to keep the hook pure).

### 3. Update `OrderFormData` Type & Store

**File:** `lib/order-form-store.ts`

- Add new fields to `OrderFormData`:
  - `customerId?: string` — ID of the selected existing user (undefined for new customer)
  - `shippingAddressId?: string` — already exists
  - `billingAddressId?: string` — already exists
  - `customerMode: "existing" | "new"` — tracks which mode the user chose
- Note: `shippingAddressId` and `billingAddressId` already exist in `OrderFormData`. Those will be populated when the user picks from existing addresses.

### 4. Update Zod Schema

**File:** `app/dashboard/orders/new/page.tsx`

- Add to `orderFormSchema`:
  - `customerMode: z.enum(["existing", "new"]).default("new")`
  - `customerId: z.string().optional()`
  - `shippingAddressId: z.string().optional()`
  - `billingAddressId: z.string().optional()`
- Adjust the `.refine()`:
  - When `customerMode === "existing"`, `customerId` must be present.
  - When `customerMode === "new"`, current email/name validations apply.
  - Address validation: when `shippingAddressId` is set, the inline shipping address fields can be optional (skip city-required check). Same for billing.

### 5. Redesign Customer Information Card

**File:** `app/dashboard/orders/new/page.tsx`

Replace the existing "Customer Information" `<Card>` with a toggle-based UI:

- **Toggle/Tabs at the top** of the card: two options — "Existing Customer" | "New Customer" (use shadcn `Tabs` or a simple `RadioGroup`/`Button` toggle).
- **"Existing Customer" mode:**
  - Show a search input with debounced search (using `useDebounce`).
  - Display search results as a list/dropdown below the input (use `Command` component from cmdk for the combobox pattern, or a simple list with click handlers).
  - Each result item shows: name, email, phone.
  - On selecting a user:
    - Set `customerId`, `customerEmail`, `customerName`, `customerPhone` from the selected user.
    - Show a "selected user" badge/card with the user's info and a "Clear" button to deselect.
    - Store the selected user's `addresses` array in local component state (not in the form — it's used for the address picker UI).
  - The email/name/phone fields become **read-only** when a user is selected (or hidden, replaced by a summary card).
- **"New Customer" mode:**
  - Current form fields (email, name, phone) — unchanged.
  - Clear `customerId` when switching to this mode.
- Switching modes should reset customer fields and address selections.

### 6. Add Address Picker to Address Cards

**File:** `app/dashboard/orders/new/page.tsx`

When an existing customer is selected and they have addresses:

- **Shipping Address Card:**
  - At the top, show a dropdown/radio to pick from the user's saved shipping addresses (filter `addresses` where `addressType === "shipping"`), plus an option "Enter custom address".
  - When a saved address is selected:
    - Set `shippingAddressId` in the form.
    - Populate the address fields (street, city, state, postal_code, country) as read-only display (or hide the form fields and show a summary).
  - When "Enter custom address" is selected:
    - Clear `shippingAddressId`.
    - Show the current editable address form fields.
  - If the user has no shipping addresses, default to "Enter custom address".

- **Billing Address Card:**
  - Same pattern as shipping, filtering `addressType === "billing"`.
  - The "same as shipping" checkbox still works:
    - If checked and a shipping address was selected from saved, set `billingAddressId` to the shipping address ID (or let the backend handle it).
    - If unchecked, show the billing address picker.

### 7. Update `onSubmit` Handler

**File:** `app/dashboard/orders/new/page.tsx`

- When saving draft, include `customerId`, `customerMode`, `shippingAddressId`, `billingAddressId`.
- The `saveOrderFormDraft(values)` call already saves the full form — just ensure the new fields flow through.

### 8. Update `CreateOrderPayload` and `useCreateOrder`

**Files:** `lib/api/orders.ts`, `hooks/use-orders.ts`

- Add `userId?: string`, `shippingAddressId?: string`, `billingAddressId?: string` to `CreateOrderPayload`.
- In `useCreateOrder` mutation:
  - If `customerId` is set, send it as `userId` in the payload.
  - If `shippingAddressId` is set, send it directly — no need for inline address.
  - Same for `billingAddressId`.
  - When address IDs are absent (new/custom address), send inline address objects as currently done.

### 9. Update Review Page

**File:** `app/dashboard/orders/new/review/page.tsx`

Changes needed:

- **Customer Details card:**
  - If `customerId` is present in the draft, show a label like "Existing Customer" alongside the name/email/phone.
  - If new customer, show as-is.

- **Addresses card:**
  - If `shippingAddressId` is present, indicate "Saved Address" (e.g., a small badge).
  - If custom address, show as-is (current behavior).
  - Same for billing.

- **Submit handler:** No changes needed — it already calls `createOrderMutation.mutate(draft)` which goes through `useCreateOrder` that we updated in step 8.

### 10. Component Extraction (Optional but Recommended)

The order form page is already long. Consider extracting:

- `components/dashboard/orders/CustomerSelector.tsx` — The toggle + search + existing user selection UI.
- `components/dashboard/orders/AddressPicker.tsx` — The address selection dropdown for saved addresses.

This keeps the main page file manageable.

---

## Edge Cases to Handle

1. **User has no addresses:** When selecting an existing customer with an empty `addresses` array, default to "Enter custom address" mode. Don't show the address picker dropdown.

2. **Switching between existing/new customer:** Reset `customerId`, `shippingAddressId`, `billingAddressId`, and clear auto-filled fields. Don't carry over selected addresses from one mode to another.

3. **Selected user has only shipping addresses but no billing:** Show the address picker for shipping, default billing to "Enter custom address" or let "same as shipping" handle it.

4. **Draft restoration:** When loading a draft (`loadOrderFormDraft`), if `customerId` was set, refetch the user data via the API to restore the full user object including addresses. This re-enables the address picker. Show the "Existing Customer" mode with the selected user's info in read-only and their addresses available for selection.

5. **Search returns many results:** Use pagination (`page`, `perPage`). Start with `perPage=10`. Show "Load more" or scrollable list in the combobox. For v1, a simple scrollable list is fine.

6. **Debounced search timing:** Use the existing `useDebounce(searchTerm, 500)` hook to avoid excessive API calls while typing.

7. **User clears selection:** Provide a visible "Clear" / "×" button on the selected user card. Clearing should revert to the search input state without switching to "New Customer" mode (the user might want to search for someone else).

8. **"Same as shipping" with saved address:** When "same as shipping" is checked and a saved shipping address was selected (with `shippingAddressId`), the billing address should logically reference the same address. Set `billingAddressId = shippingAddressId` in the submit handler or let the backend infer it.

9. **Form validation when existing customer is selected:** The email/name fields should still be filled (from the selected user) and pass validation. Since we auto-populate them, this should work transparently. Just ensure they're in the form state.

10. **Address `country` field:** The API response doesn't include `country` in addresses. The address picker should leave country empty/editable, or skip it.

---

## Resolved Questions

1. **Backend contract:** Confirmed. `POST /orders` accepts `userId`, `shippingAddressId`, `billingAddressId` as UUID strings. When address IDs are provided, send them directly — no need to duplicate inline address objects.

2. **User search API authentication:** Admin-only. The create order page is also admin-only, so the customer selector is always available — no conditional visibility needed.

3. **Draft restoration:** Yes — when restoring a draft with `customerId`, refetch the user via a `useQuery` call (e.g., a `useUserById` or re-search by ID/email) to restore the full user object including addresses. This allows the address picker to function on page reload.

4. **Address `isDefault` field:** Yes — auto-select the `isDefault` address when a user is selected. If no address is marked default, fall back to the first address of that type, or "Enter custom address".

---

## Files Changed Summary

| File                                               | Action                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| `lib/api/users.ts`                                 | **Create** — User search API function and types                           |
| `hooks/use-users.ts`                               | **Create** — `useSearchUsers` hook                                        |
| `lib/order-form-store.ts`                          | **Modify** — Add `customerId`, `customerMode` to `OrderFormData`          |
| `lib/api/orders.ts`                                | **Modify** — Add optional ID fields to `CreateOrderPayload`               |
| `hooks/use-orders.ts`                              | **Modify** — Pass new fields in `useCreateOrder`                          |
| `app/dashboard/orders/new/page.tsx`                | **Modify** — Major: toggle UI, customer search, address picker            |
| `app/dashboard/orders/new/review/page.tsx`         | **Modify** — Minor: show existing customer badge, saved address indicator |
| `components/dashboard/orders/CustomerSelector.tsx` | **Create** (optional) — Extracted component                               |
| `components/dashboard/orders/AddressPicker.tsx`    | **Create** (optional) — Extracted component                               |
