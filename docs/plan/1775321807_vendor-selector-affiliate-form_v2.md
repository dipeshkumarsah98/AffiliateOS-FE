# Plan: Vendor Selector for Affiliate Creation Form (v2)

## Summary

Currently, the "New Affiliate" page always requires manually entering vendor personal details (name, email, contact, address, affiliate type) and bank details. Since one vendor can have multiple affiliate codes, admins should be able to select an existing vendor/admin instead of re-entering everything. This plan introduces a tab-based "Existing Vendor / New Vendor" selector (modelled after the existing `CustomerSelector.tsx` in the orders flow), auto-fills personal + bank details from the selected user, and updates the API layer to support passing an existing `vendorId` instead of creating a new vendor.

### Confirmed Backend Behaviour

- POST `/affiliates` **already** supports `vendorId: "UUID"` to link an existing vendor.
- Bank details are part of the `vendor` object; the backend uses them to populate the vendor's extras.
- `contact` = the user's `phone` field.
- Address should use the **billing address** (`addressType === "billing"`) from the user's `addresses[]` array with structured fields: `street_address`, `city`, `state`, `postal_code`.
- `roles` is an array — display a badge per role in search results.

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

### 4. Restructure address fields (replace single `physicalAddress`)

**Files:** `lib/affiliate-form-store.ts`, `app/dashboard/affiliates/new/page.tsx`, `lib/api/affiliates.ts`, `app/dashboard/affiliates/new/review/page.tsx`

Currently the form uses a single `physicalAddress: string` textarea. This must be replaced with structured address fields matching the backend address schema.

**Replace `physicalAddress` with:**

```typescript
// In AffiliateFormData and Zod schema
streetAddress: string; // maps to street_address
city: string;
state: string;
postalCode: string; // maps to postal_code
```

**Zod schema changes:**

```typescript
streetAddress: z.string(),
city: z.string(),
state: z.string(),
postalCode: z.string(),
```

(Remove `physicalAddress` field entirely.)

**Form UI changes in `page.tsx`:**

- Replace the single `physicalAddress` Textarea with a grid of 4 fields:
  ```
  Row 1: Street Address (full width textarea, 2 rows)
  Row 2: City | State | Postal Code (3 columns)
  ```

**Update `CreateAffiliatePayload` vendor.address:**

- Change `address: string` to a structured object:
  ```typescript
  vendor: {
    // ...
    address: {
      street_address: string;
      city: string;
      state: string;
      postal_code: string;
    }
  }
  ```

**Update review page `buildApiPayload()`:**

- Build the address object from the 4 form fields
- Display structured address in the review UI (e.g., "Street, City, State Postal")

**Update edit mode data loading (`useEffect`):**

- When loading `existingAffiliate`, map the vendor's billing address (from `vendor.addresses` or `vendor.extras.address`) to the 4 fields.

### 5. Create `VendorSelector` component

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
      - ScrollArea with search results
        - Each result shows: name, email, phone
        - Role badges (array) for each user
        - extras.affiliateType badge if present
      - Selected vendor display card with clear button
      - Empty states (no search term, no results)

    Tab "new":
      - Full Name, Email, Affiliate Type, Contact Number fields
      - Structured address fields: Street Address, City, State, Postal Code
  ```

- **When a vendor is selected (`handleVendorSelect`):**
  1. Set `selectedVendor` state
  2. Set form fields:
     - `vendorMode` → `"existing"`
     - `vendorId` → `user.id`
     - `fullName` → `user.name`
     - `email` → `user.email`
     - `contactNumber` → `user.phone` (phone = contact)
     - `affiliateType` → map from `user.extras?.affiliateType` (UPPERCASE → lowercase), default `"influencer"`
     - Address fields → pull from **billing address** (`addresses.find(a => a.addressType === "billing")`):
       - `streetAddress` → `billingAddr.street_address ?? ""`
       - `city` → `billingAddr.city ?? ""`
       - `state` → `billingAddr.state ?? ""`
       - `postalCode` → `billingAddr.postal_code ?? ""`
     - `bankName` → `user.extras?.bankName ?? ""`
     - `accountNumber` → `user.extras?.accountNumber ?? ""`

- **When selection is cleared (`handleClearSelection`):**
  1. Reset `selectedVendor` to null
  2. Clear all vendor-related form fields back to defaults (empty strings)
  3. Clear bank detail fields
  4. Clear address fields

- **When switching to "New Vendor" tab:**
  1. Clear selected vendor
  2. Reset form fields to empty defaults for manual entry

### 6. Update `AffiliateFormData` type and form schema

**File:** `lib/affiliate-form-store.ts`

Add new fields, remove `physicalAddress`:

```typescript
export interface AffiliateFormData {
  // Vendor selection mode
  vendorMode: "existing" | "new"; // NEW
  vendorId?: string; // NEW: set when existing vendor selected

  // Personal
  fullName: string;
  email: string;
  affiliateType: "influencer" | "reseller" | "referral" | "partner";
  contactNumber: string;

  // Address (replaces physicalAddress)
  streetAddress: string; // NEW
  city: string; // NEW
  state: string; // NEW
  postalCode: string; // NEW

  // Affiliate
  selectedProductId: string;
  affiliateCode: string;
  discountType: "fixed" | "percentage";
  discountValue: string;
  commissionType: "fixed" | "percentage";
  commissionValue: string;

  // Bank
  bankName: string;
  accountNumber: string;

  // Meta
  editId?: string;
}
```

**File:** `app/dashboard/affiliates/new/page.tsx` — Update the Zod schema:

```typescript
const affiliateFormSchema = z
  .object({
    vendorMode: z.enum(["existing", "new"]),
    vendorId: z.string().optional(),
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email address"),
    affiliateType: z.enum(["influencer", "reseller", "referral", "partner"]),
    contactNumber: z.string(),
    streetAddress: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    // ... rest unchanged
  })
  .refine(
    (data) =>
      data.vendorMode === "new" ||
      (data.vendorMode === "existing" && data.vendorId),
    { message: "Please select a vendor", path: ["vendorId"] },
  );
```

### 7. Update `CreateAffiliatePayload` to support existing vendor

**File:** `lib/api/affiliates.ts`

The backend accepts either a `vendor` object (for new) or a `vendorId` (for existing):

```typescript
// Shared affiliate payload shape
export interface AffiliatePayload {
  productId: string;
  code: string;
  discountType: DiscountTypeAPI;
  discountValue: number;
  commissionType: CommissionTypeAPI;
  commissionValue: number;
}

// Structured vendor address
export interface VendorAddress {
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
}

// POST /affiliates payload — new vendor
export interface CreateAffiliateWithNewVendor {
  vendor: {
    name: string;
    email: string;
    affiliateType: AffiliateTypeAPI;
    contact: string;
    address: VendorAddress;
    bankName: string;
    accountNumber: string;
  };
  affiliate: AffiliatePayload;
}

// POST /affiliates payload — existing vendor
export interface CreateAffiliateWithExistingVendor {
  vendorId: string;
  affiliate: AffiliatePayload;
}

export type CreateAffiliatePayload =
  | CreateAffiliateWithNewVendor
  | CreateAffiliateWithExistingVendor;
```

### 8. Update the affiliate form page

**File:** `app/dashboard/affiliates/new/page.tsx`

- Import `VendorSelector` component
- Add `vendorMode`, `vendorId`, and the 4 address fields to form `defaultValues`
- Replace the "Personal Details" `<Card>` section with `<VendorSelector>` when NOT in edit mode
- In edit mode, keep the current read-only personal details display (vendor cannot be changed after creation) — but update the address display to use the 4 structured fields
- Update `onSubmit` to include `vendorMode`, `vendorId`, and structured address in `AffiliateFormData`

**Bank Details Card conditional behaviour:**

- When `vendorMode === "existing"` AND the selected vendor has bank details (non-empty `bankName` / `accountNumber`): show bank details as **read-only preview** (auto-filled from vendor)
- When `vendorMode === "existing"` AND vendor has NO bank details: show editable bank fields so admin can provide them
- When `vendorMode === "new"`: show editable bank fields as current
- In edit mode: show read-only as current

### 9. Update the review page

**File:** `app/dashboard/affiliates/new/review/page.tsx`

- In `buildApiPayload()`, check `data.vendorMode`:
  - If `"existing"`: build `CreateAffiliateWithExistingVendor` payload with `vendorId` + `affiliate`
  - If `"new"`: build `CreateAffiliateWithNewVendor` payload with full `vendor` object (including structured address: `{ street_address: data.streetAddress, city: data.city, state: data.state, postal_code: data.postalCode }` + `contact: data.contactNumber`) + `affiliate`
- In the review UI:
  - When `vendorMode === "existing"`, show a badge "Existing Vendor" next to the personal details section
  - Display structured address as formatted string: `"Street, City, State Postal"`

### 10. Update draft restore logic

**File:** `app/dashboard/affiliates/new/page.tsx`

- When restoring from draft, also restore `vendorMode`, `vendorId`, and the 4 address fields (replace `physicalAddress`)
- If draft has `vendorMode === "existing"` and `vendorId`, the VendorSelector should show the selected vendor card. Store enough vendor info (id, name, email, phone) in the form draft to reconstruct the selected card without an extra API call when returning from review.
- All existing `form.reset()` calls (draft restore, edit mode load) must use the new field names.

---

## Edge Cases to Handle

1. **Vendor already has an affiliate for the same product**: The backend validates this and returns an error. Display it via toast.

2. **Stale vendor data after selection**: When the user clears a selected vendor or switches tabs, all auto-filled fields (personal, address, bank) must be cleared back to empty defaults.

3. **Draft restoration with existing vendor**: When navigating back from the review page, a draft with `vendorMode === "existing"` needs to restore the selected vendor UI state. Store enough vendor info (id, name, email, phone) in the form draft to reconstruct the selected card without an API call.

4. **Search debounce**: Use the existing `useDebounce` hook with 500ms delay to avoid excessive API calls while typing.

5. **Empty search state**: When no search term is entered, show a prompt icon/message ("Start typing to search for vendors/admins") — same pattern as `CustomerSelector.tsx`.

6. **Vendor with no bank details**: When an existing vendor doesn't have `extras.bankName` or `extras.accountNumber`, the Bank Details section should remain editable so the admin can provide them. The provided bank details will be sent in the `vendor` object for the backend to populate.

7. **Vendor with no billing address**: When a selected vendor has no address with `addressType === "billing"`, leave address fields empty and editable.

8. **API params serialization**: The `role` parameter needs to be sent as repeated query params (`role=admin&role=vendor`), not as `role[]=admin`. Use a custom `paramsSerializer`.

9. **Edit mode**: When editing an existing affiliate (`?editId=xxx`), the vendor selector is NOT shown. Keep the current read-only personal/bank details display — vendor cannot be changed after creation. Address fields in edit mode should display the structured format read-only.

10. **Switching between tabs**: When toggling between "Existing Vendor" and "New Vendor" tabs, clear the form fields appropriately to avoid submitting stale data from the other mode.

11. **Form validation**: When `vendorMode === "existing"`, personal detail fields auto-fill so no manual validation needed beyond `vendorId` being set. When `vendorMode === "new"`, all required fields must be validated as before.

12. **Role badges in search results**: Display each role from the `roles[]` array as a separate badge. Use distinct badge variants (e.g., "Admin" primary, "Vendor" secondary).

13. **`physicalAddress` migration**: Any existing drafts in `sessionStorage` with the old `physicalAddress` field will fail to restore correctly. Add a safe fallback: if `streetAddress` is missing but `physicalAddress` exists, put `physicalAddress` into `streetAddress` and leave city/state/postalCode empty.

---

## Files Changed Summary

| File                                                 | Change                                                                                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/api/users.ts`                                   | Add `UserExtras` type, extend `UserSearchItem`, extend `SearchUsersParams`, update `searchUsers()` with serializer                                    |
| `hooks/use-users.ts`                                 | Add `useSearchVendors` hook                                                                                                                           |
| `lib/affiliate-form-store.ts`                        | Add `vendorMode`, `vendorId`, replace `physicalAddress` → 4 address fields                                                                            |
| `lib/api/affiliates.ts`                              | Add `VendorAddress`, restructure `CreateAffiliatePayload` as union, update `vendor.address` to structured object                                      |
| `components/dashboard/affiliates/VendorSelector.tsx` | **New file** — tab-based vendor selector component                                                                                                    |
| `app/dashboard/affiliates/new/page.tsx`              | Update Zod schema, default values, import VendorSelector, replace Personal Details card, update address form fields, conditional bank details display |
| `app/dashboard/affiliates/new/review/page.tsx`       | Update `buildApiPayload()` for vendor mode branching + structured address, add "Existing Vendor" badge in UI                                          |
