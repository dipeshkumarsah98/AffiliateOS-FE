# Plan: Vendor Selector for Affiliate Creation Form

## Summary

Currently, the "New Affiliate" page always requires manually entering vendor personal details (name, email, contact, address, affiliate type) and bank details. Since one vendor can have multiple affiliate codes, admins should be able to select an existing vendor/admin instead of re-entering everything. This plan introduces a tab-based "Existing Vendor / New Vendor" selector (modelled after the existing `CustomerSelector.tsx` in the orders flow), auto-fills personal + bank details from the selected user, and updates the API layer to support passing an existing `vendorId` instead of creating a new vendor.

---

## Implementation Steps

### 1. Update `UserSearchItem` type to include `extras` field

**File:** `lib/api/users.ts`

The current `UserSearchItem` interface does not include the `extras` field that the API returns when `extras=true` is passed. The response shows extras contain `bankName`, `accountNumber`, and `affiliateType`.

- Add an `extras` field to `UserSearchItem`:

  ```typescript
  export interface UserExtras {
    bankName?: string;
    accountNumber?: string;
    affiliateType?: string;
    contact?: string;
    address?: string;
  }

  export interface UserSearchItem {
    id: string;
    email: string;
    name: string;
    phone: string;
    roles: string[];
    createdAt: string;
    extras?: UserExtras;
    addresses: UserAddress[];
  }
  ```

### 2. Update `SearchUsersParams` to support role filtering and extras

**File:** `lib/api/users.ts`

The current `searchUsers` function only passes `search`, `page`, and `perPage`. The vendor search requires additional params: `role` (array), `extras`, `sortBy`, `sortOrder`.

- Extend `SearchUsersParams`:
  ```typescript
  export interface SearchUsersParams {
    search: string;
    page?: number;
    perPage?: number;
    role?: string[]; // NEW: filter by roles (e.g., ['admin', 'vendor'])
    extras?: boolean; // NEW: include extras in response
    sortBy?: string; // NEW: sort field
    sortOrder?: "asc" | "desc"; // NEW: sort direction
  }
  ```
- Update `searchUsers()` to serialize `role` as repeated query params (`role=admin&role=vendor`). Axios handles array params differently by default, so use `paramsSerializer` or pass the params object with array handling:
  ```typescript
  const { data } = await apiClient.get<SearchUsersResponse>("/users", {
    params,
    paramsSerializer: (params) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v));
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      return searchParams.toString();
    },
  });
  ```

### 3. Create `useSearchVendors` hook

**File:** `hooks/use-users.ts`

Add a new hook specifically for the vendor search use case. It wraps `useSearchUsers` logic but hardcodes `role=['admin','vendor']`, `extras=true`, `sortBy='roles'`, `sortOrder='asc'`.

```typescript
export function useSearchVendors(search: string, page = 1, perPage = 10) {
  return useQuery({
    queryKey: queryKeys.users.list({
      search,
      page,
      perPage,
      context: "vendors",
    }),
    queryFn: () =>
      searchUsers({
        search,
        page,
        perPage,
        role: ["admin", "vendor"],
        extras: true,
        sortBy: "roles",
        sortOrder: "asc",
      }),
    placeholderData: (previousData) => previousData,
  });
}
```

### 4. Create `VendorSelector` component

**File:** `components/dashboard/affiliates/VendorSelector.tsx`

Build a new component modelled after `CustomerSelector.tsx` with the following structure:

- **Props:**

  ```typescript
  interface VendorSelectorProps {
    form: UseFormReturn<any>;
    disabled?: boolean; // True in edit mode
  }
  ```

- **Internal state:**
  - `searchTerm` (string) — raw input
  - `selectedVendor` (UserSearchItem | null) — the vendor currently selected
  - `vendorMode` — read from form field `vendorMode` (values: `"existing"` | `"new"`)

- **UI structure (only shown when NOT in edit mode):**

  ```
  Card: "Vendor / Admin Information"
    Tabs: [Existing Vendor] [New Vendor]

    Tab "existing":
      - Search input with debounce (500ms)
      - Loading spinner while searching
      - ScrollArea with search results (show name, email, phone, roles badge, extras.affiliateType)
      - Selected vendor display card with clear button
      - Empty states (no search term, no results)

    Tab "new":
      - Full Name, Email, Affiliate Type, Contact Number, Physical Address fields
      - (Current form fields, unchanged)
  ```

- **When a vendor is selected (`handleVendorSelect`):**
  1. Set `selectedVendor` state
  2. Set form fields:
     - `vendorMode` → `"existing"`
     - `vendorId` → `user.id`
     - `fullName` → `user.name`
     - `email` → `user.email`
     - `contactNumber` → `user.phone`
     - `affiliateType` → map from `user.extras?.affiliateType` (UPPERCASE → lowercase)
     - `physicalAddress` → first address's `street_address` if available (or `user.extras?.address`)
     - `bankName` → `user.extras?.bankName ?? ""`
     - `accountNumber` → `user.extras?.accountNumber ?? ""`
  3. Call `onVendorSelect(user)` callback if provided

- **When selection is cleared (`handleClearSelection`):**
  1. Reset `selectedVendor` to null
  2. Clear all vendor-related form fields back to defaults
  3. Clear bank detail fields

- **When switching to "New Vendor" tab:**
  1. Clear selected vendor
  2. Reset form fields to empty defaults for manual entry

### 5. Update `AffiliateFormData` type and form schema

**File:** `lib/affiliate-form-store.ts`

Add two new fields:

```typescript
export interface AffiliateFormData {
  // Vendor selection mode
  vendorMode: "existing" | "new"; // NEW
  vendorId?: string; // NEW: set when existing vendor selected

  // Personal (used for "new" vendor mode, populated from selection for "existing")
  fullName: string;
  email: string;
  // ... rest unchanged
}
```

**File:** `app/dashboard/affiliates/new/page.tsx` — Update the Zod schema:

```typescript
const affiliateFormSchema = z.object({
  vendorMode: z.enum(["existing", "new"]), // NEW
  vendorId: z.string().optional(), // NEW
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  // ... rest unchanged
});
```

Add cross-field validation: when `vendorMode === 'existing'`, `vendorId` must be present.

### 6. Update `CreateAffiliatePayload` to support existing vendor

**File:** `lib/api/affiliates.ts`

The backend likely accepts either a `vendor` object (for new) or a `vendorId` (for existing). The payload should support both:

```typescript
// POST /affiliates payload — new vendor
export interface CreateAffiliateWithNewVendor {
  vendor: {
    name: string;
    email: string;
    affiliateType: AffiliateTypeAPI;
    contact: string;
    address: string;
    bankName: string;
    accountNumber: string;
  };
  affiliate: { ... };
}

// POST /affiliates payload — existing vendor
export interface CreateAffiliateWithExistingVendor {
  vendorId: string;
  affiliate: { ... };
}

export type CreateAffiliatePayload =
  | CreateAffiliateWithNewVendor
  | CreateAffiliateWithExistingVendor;
```

> **Open Question:** Confirm with backend team how the API distinguishes between new vs existing vendor. Options:
>
> - Presence of `vendorId` field means existing; presence of `vendor` object means new
> - A `vendor.id` field inside the vendor object
> - Separate endpoints

### 7. Update the affiliate form page

**File:** `app/dashboard/affiliates/new/page.tsx`

- Import `VendorSelector` component
- Add `vendorMode` and `vendorId` to form `defaultValues`
- Replace the "Personal Details" `<Card>` section with `<VendorSelector>` when NOT in edit mode
- In edit mode, keep the current read-only personal details display (no vendor selection needed)
- Update `onSubmit` to include `vendorMode` and `vendorId` in `AffiliateFormData`

**Bank Details Card conditional behavior:**

- When `vendorMode === "existing"` AND the selected vendor has bank details (non-empty `bankName`/`accountNumber`): show bank details as **read-only preview** (auto-filled from vendor)
- When `vendorMode === "existing"` AND vendor has NO bank details: show editable bank fields
- When `vendorMode === "new"`: show editable bank fields as current
- In edit mode: show read-only as current

### 8. Update the review page

**File:** `app/dashboard/affiliates/new/review/page.tsx`

- In `buildApiPayload()`, check `data.vendorMode`:
  - If `"existing"`: build `CreateAffiliateWithExistingVendor` payload with `vendorId`
  - If `"new"`: build `CreateAffiliateWithNewVendor` payload with `vendor` object (current behavior)
- In the review UI, when `vendorMode === "existing"`, show a badge like "Existing Vendor" next to the personal details section to indicate this vendor already exists in the system

### 9. Update draft restore logic

**File:** `app/dashboard/affiliates/new/page.tsx`

- When restoring from draft, also restore `vendorMode` and `vendorId`
- If draft has `vendorMode === "existing"` and `vendorId`, the VendorSelector should show the selected vendor card (requires re-fetching the vendor details by ID, or storing enough info in the draft)
- Consider storing `selectedVendorSnapshot` in the form data (name + email + phone) so the selected vendor card can be shown without an extra API call when returning from review

---

## Edge Cases to Handle

1. **Vendor already has an affiliate for the same product**: The backend should validate this and return a clear error message. The frontend should display this error via toast.

2. **Stale vendor data after selection**: Once a vendor is selected and form fields are populated, the user might switch tabs back to "Existing" and clear the selection. All auto-filled fields (including bank details) must be properly cleared.

3. **Draft restoration with existing vendor**: When navigating back from the review page, a draft with `vendorMode === "existing"` needs to restore the selected vendor UI state. Store enough vendor info (id, name, email, phone) in the form draft to reconstruct the selected card without an API call.

4. **Search debounce**: Use the existing `useDebounce` hook with 500ms delay to avoid excessive API calls while typing.

5. **Empty search state**: When no search term is entered, show a prompt icon/message ("Start typing to search for vendors/admins") — same pattern as `CustomerSelector.tsx`.

6. **Vendor with no bank details**: When an existing vendor doesn't have `extras.bankName` or `extras.accountNumber`, the Bank Details section should remain editable so the admin can provide them for this affiliate.

7. **API params serialization**: The `role` parameter needs to be sent as repeated query params (`role=admin&role=vendor`), not as `role[]=admin`. Verify Axios serialization or use a custom serializer.

8. **Edit mode**: When editing an existing affiliate (`?editId=xxx`), the vendor selector should not be shown. Keep the current read-only personal/bank details display — vendor cannot be changed after creation.

9. **Switching between tabs**: When toggling between "Existing Vendor" and "New Vendor" tabs, clear the form fields appropriately to avoid submitting stale data from the other mode.

10. **Form validation**: When `vendorMode === "existing"`, personal detail fields should not require manual validation since they're auto-filled. When `vendorMode === "new"`, all required fields must be validated as before.

---

## Open Questions

1. **Backend API contract for existing vendor**: Does the POST `/affiliates` endpoint already support a `vendorId` field, or does it only support the `vendor` object? If not supported yet, this needs backend changes first. **This must be confirmed before implementation begins.**

2. **Bank details update for existing vendor**: If an existing vendor is selected but has no bank details, should submitting the form also update the vendor's bank details in the backend? Or should it only be stored on the affiliate record?

3. **Vendor extras completeness**: The `extras` field from the API response includes `bankName`, `accountNumber`, `affiliateType`. Does it also include `contact` and `address`? The sample response only shows those three fields, but the `AffiliateVendorExtras` type includes `contact` and `address` for the affiliate detail endpoint. Need to confirm if the `/users?extras=true` endpoint returns all of these.

4. **Role display**: Should the search results show the user's role(s) as a badge (e.g., "Admin", "Vendor")? The sample response shows `roles: []` which is empty — is that expected for vendors, or do vendors actually have roles populated?
