# Plan: Migrate Auth State from React Context to Zustand with Persistence

## Summary

The current auth flow (email → OTP → JWT token → user session) is managed by a React Context (`AppProvider` / `useApp` in `lib/store.tsx`) with manual `localStorage` read/write calls. This plan migrates all auth state to a Zustand store (`stores/auth-store.ts`) using Zustand's built-in `persist` middleware. The store will automatically persist `authToken`, `currentUser`, and `pendingEmail` to `localStorage` and rehydrate on page load—eliminating the manual `useEffect`-based hydration, the `AppProvider` context wrapper, and the raw `localStorage` calls scattered across the codebase. All 20 consumer files will switch from `useApp()` to the new `useAuthStore()` hook.

---

## Current Architecture

| Concern         | Current Implementation                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| State container | `AppContext` (React Context) in `lib/store.tsx`                                                       |
| State shape     | `currentUser`, `authToken`, `pendingEmail`, `login()`, `verifyOtp()`, `logout()`, `setPendingEmail()` |
| Persistence     | Manual `localStorage.getItem/setItem` in a `useEffect` + `verifyOtp` callback                         |
| Provider        | `<AppProvider>` wrapping app in `app/layout.tsx`                                                      |
| Consumer hook   | `useApp()` — used in **20 files** across pages, components, and hooks                                 |
| Token sync      | `setApiToken()` called manually in `verifyOtp()`, `logout()`, and the hydration `useEffect`           |

### Files that consume `useApp()`

**Pages (13):**

- `app/(auth)/login/otp/page.tsx` → `pendingEmail`
- `app/dashboard/layout.tsx` → `currentUser`
- `app/dashboard/page.tsx` → `currentUser`
- `app/dashboard/orders/page.tsx` → `currentUser`
- `app/dashboard/affiliates/page.tsx` → `currentUser`
- `app/dashboard/affiliates/new/page.tsx` → `currentUser`
- `app/dashboard/affiliates/new/review/page.tsx` → `currentUser`
- `app/dashboard/earnings/page.tsx` → `currentUser`
- `app/dashboard/admin/page.tsx` → `currentUser`
- `app/dashboard/profile/page.tsx` → `currentUser`, `logout`
- `app/dashboard/products/page.tsx` → `currentUser`
- `app/dashboard/my-orders/page.tsx` → `currentUser`
- `app/dashboard/my-withdrawals/page.tsx` → `currentUser`

**Components (3):**

- `components/layout/Sidebar.tsx` → `currentUser`
- `components/layout/Topbar.tsx` → `currentUser`, `logout`
- `components/dashboard/products/ProductDetailDialog.tsx` → `currentUser`

**Hooks (1):**

- `hooks/use-auth.ts` → `login`, `verifyOtp`

**Provider setup (1):**

- `app/layout.tsx` → `AppProvider`

---

## Implementation Steps

### Step 1: Create the Zustand auth store

**File:** `stores/auth-store.ts` (new)

Create a Zustand store using `create` + `persist` middleware:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
```

**State interface:**

```typescript
interface AuthState {
  // Persisted state
  currentUser: User | null;
  authToken: string | null;
  pendingEmail: string | null;

  // Actions
  login: (email: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => void;
  setPendingEmail: (email: string | null) => void;
}
```

**Persist config:**

- `name`: `"auth-storage"` (localStorage key)
- `partialize`: persist only `currentUser`, `authToken`, `pendingEmail` (exclude action functions)
- `onRehydrateStorage`: call `setApiToken(state.authToken)` after rehydration to sync the Axios interceptor

**Key logic inside actions:**

- `login`: call `sendOtpRequest({ email })`, then `set({ pendingEmail: email })`
- `verifyOtp`: call `verifyOtpRequest({ email: pendingEmail, code: otp })`, map the API user → `User`, call `setApiToken(token)`, set `currentUser`, `authToken`, clear `pendingEmail`
- `logout`: clear all state, call `setApiToken(null)`

**Helper functions** (keep existing from `lib/store.tsx`):

- `mapApiRolesToUserRoles()`
- `buildDisplayName()`
- `mapApiUserToUser()`

Move these into `stores/auth-store.ts` as module-level private helpers (not exported — or export only if needed elsewhere).

### Step 2: Update `hooks/use-auth.ts`

Replace `useApp()` import with `useAuthStore` import:

```typescript
import { useAuthStore } from "@/stores/auth-store";
```

- `useSendOtpMutation`: use `useAuthStore((s) => s.login)` instead of `useApp().login`
- `useVerifyOtpMutation`: use `useAuthStore((s) => s.verifyOtp)` instead of `useApp().verifyOtp`

### Step 3: Update `app/(auth)/login/otp/page.tsx`

Replace:

```typescript
import { useApp } from "@/lib/store";
const { pendingEmail } = useApp();
```

With:

```typescript
import { useAuthStore } from "@/stores/auth-store";
const pendingEmail = useAuthStore((s) => s.pendingEmail);
```

### Step 4: Update all dashboard pages and components

For each of the 16 files that use `currentUser` and/or `logout`:

Replace:

```typescript
import { useApp } from "@/lib/store";
const { currentUser } = useApp();
```

With:

```typescript
import { useAuthStore } from "@/stores/auth-store";
const currentUser = useAuthStore((s) => s.currentUser);
```

For files that also use `logout` (e.g., `profile/page.tsx`, `Topbar.tsx`):

```typescript
const logout = useAuthStore((s) => s.logout);
```

**Use individual selectors** (not destructuring) to minimise re-renders — this is a Zustand best practice.

### Step 5: Remove `AppProvider` from `app/layout.tsx`

- Remove the `<AppProvider>` wrapper (Zustand stores don't need a provider)
- Remove the import of `AppProvider` from `@/lib/store`
- Keep `<QueryProvider>` as-is

### Step 6: Delete or archive `lib/store.tsx`

- Delete `lib/store.tsx` entirely once all consumers are migrated
- The `AppContext`, `AppProvider`, and `useApp` exports will no longer exist

### Step 7: Clean up `lib/api/client.ts` request interceptor

The current Axios request interceptor reads `auth_token` from `localStorage` on every request as a fallback:

```typescript
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('auth_token')
    ...
  }
})
```

This should be updated to read from the Zustand store instead:

```typescript
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

This is cleaner because the persist middleware already keeps `authToken` in sync with localStorage. The interceptor now reads from a single source of truth.

> **Note:** `useAuthStore.getState()` can be called outside of React components — this is a core Zustand feature.

### Step 8: Handle hydration timing

Zustand's persist middleware hydrates asynchronously. During SSR or the first client render, the store will have its initial values (all `null`). This matters for:

- **`app/dashboard/layout.tsx`**: Currently redirects to `/login` if `!currentUser`. After migration, this redirect could fire before hydration completes. **Solution:** use Zustand's `onRehydrateStorage` callback to set a `_hasHydrated` flag, and skip the redirect while `!_hasHydrated`.

Add to the store:

```typescript
interface AuthState {
  // ... existing
  _hasHydrated: boolean;
}
```

Set `_hasHydrated: false` initially, then in `onRehydrateStorage`:

```typescript
onRehydrateStorage: () => {
  return (state) => {
    if (state) {
      state._hasHydrated = true;
      if (state.authToken) {
        setApiToken(state.authToken);
      }
    }
  };
};
```

In `app/dashboard/layout.tsx`:

```typescript
const currentUser = useAuthStore((s) => s.currentUser);
const hasHydrated = useAuthStore((s) => s._hasHydrated);

useEffect(() => {
  if (hasHydrated && !currentUser) {
    router.replace("/login");
  }
}, [currentUser, hasHydrated, router]);

if (!hasHydrated || !currentUser) return null;
```

Similarly in `app/(auth)/login/otp/page.tsx` — wait for hydration before redirecting when `!pendingEmail`.

---

## Edge Cases to Handle

1. **Hydration race condition**: The Zustand persist middleware hydrates asynchronously after the first render. Any guard that checks `currentUser === null` must also check `_hasHydrated` to distinguish "not logged in" from "hasn't hydrated yet". Affected files: `dashboard/layout.tsx`, `(auth)/login/otp/page.tsx`.

2. **localStorage key migration**: The current code uses keys `auth_token` and `auth_user`. The new Zustand persist store will use a single key `auth-storage`. On first deploy, existing users will have the old keys but not the new one. **Solution:** Add a one-time migration in `onRehydrateStorage` — if the new key is empty but old keys exist, read them, populate the store, and delete the old keys. This avoids forcing existing users to re-login.

3. **`pendingEmail` persistence**: Currently `pendingEmail` is in-memory only (Context state) and lost on page refresh. With Zustand persist, it will survive refreshes. This is actually the desired UX — if a user refreshes after requesting an OTP, they should still land on the OTP page with their email pre-filled. However, `pendingEmail` should be cleared on `logout()` and on successful `verifyOtp()`.

4. **Token expiry / invalid token on rehydration**: If a persisted token has expired, the Axios interceptor will still attach it, and API calls will fail with 401. Consider adding a 401 response interceptor to `lib/api/client.ts` that calls `useAuthStore.getState().logout()` automatically. (This is an enhancement, not a blocker.)

5. **Multiple browser tabs**: Zustand's persist middleware does not sync across tabs by default. If a user logs out in one tab, other tabs will still have the stale state until refresh. Acceptable for now, but can be addressed later with `zustand-sync-tabs` or a `storage` event listener.

6. **SSR / Server Component safety**: `useAuthStore` is a client-only hook. All current consumers already have `'use client'` directives, so no changes needed. The store file itself should not include `'use client'` — only components that call hooks need it.

---

## Open Questions

1. **Should the login page auto-redirect if `currentUser` is already set?** Currently it doesn't. With persisted state, a logged-in user visiting `/login` could be auto-redirected to `/dashboard`. Is this desired?

2. **Should we add the 401 response interceptor for auto-logout now or defer it?** It's low effort but slightly out of scope for this migration.

3. **Should `pendingEmail` be excluded from persistence?** It's ephemeral (only relevant during the OTP flow), so persisting it has a subtle risk: if a user abandons the OTP flow and comes back hours later, they'll see a stale `pendingEmail`. We could add a TTL check or clear it on any navigation away from `/login/otp`. Alternatively, exclude it from `partialize` to keep current behavior.

---

## Files Changed (Summary)

| Action     | File                                                                               |
| ---------- | ---------------------------------------------------------------------------------- |
| **Create** | `stores/auth-store.ts`                                                             |
| **Delete** | `lib/store.tsx`                                                                    |
| **Modify** | `app/layout.tsx` — remove `AppProvider`                                            |
| **Modify** | `hooks/use-auth.ts` — switch to `useAuthStore`                                     |
| **Modify** | `lib/api/client.ts` — read token from store                                        |
| **Modify** | `app/(auth)/login/otp/page.tsx` — switch to `useAuthStore`                         |
| **Modify** | `app/dashboard/layout.tsx` — switch to `useAuthStore` + hydration guard            |
| **Modify** | `app/dashboard/page.tsx` — switch to `useAuthStore`                                |
| **Modify** | `app/dashboard/orders/page.tsx` — switch to `useAuthStore`                         |
| **Modify** | `app/dashboard/affiliates/page.tsx` — switch to `useAuthStore`                     |
| **Modify** | `app/dashboard/affiliates/new/page.tsx` — switch to `useAuthStore`                 |
| **Modify** | `app/dashboard/affiliates/new/review/page.tsx` — switch to `useAuthStore`          |
| **Modify** | `app/dashboard/earnings/page.tsx` — switch to `useAuthStore`                       |
| **Modify** | `app/dashboard/admin/page.tsx` — switch to `useAuthStore`                          |
| **Modify** | `app/dashboard/profile/page.tsx` — switch to `useAuthStore`                        |
| **Modify** | `app/dashboard/products/page.tsx` — switch to `useAuthStore`                       |
| **Modify** | `app/dashboard/my-orders/page.tsx` — switch to `useAuthStore`                      |
| **Modify** | `app/dashboard/my-withdrawals/page.tsx` — switch to `useAuthStore`                 |
| **Modify** | `components/layout/Sidebar.tsx` — switch to `useAuthStore`                         |
| **Modify** | `components/layout/Topbar.tsx` — switch to `useAuthStore`                          |
| **Modify** | `components/dashboard/products/ProductDetailDialog.tsx` — switch to `useAuthStore` |

**Total: 1 new, 1 deleted, 19 modified**
