# ECommerce Dashboard - Copilot Instructions

## Project Overview

This is a Next.js 16.2.0 dashboard for an affiliate e-commerce platform. It features role-based access (admin vs vendor), product management, order tracking, and earnings reports. The frontend is built with React 19, TypeScript, Tailwind CSS 4, and shadcn/ui (New York style). It connects to an Express.js backend (not included) that provides a REST API and JWT-based authentication.

## Tech Stack

- **Framework**: Next.js 16.2.0 (App Router)
- **Runtime**: React 19, Node.js >=23.7.0
- **Language**: TypeScript (strict mode)
- **Database & Auth**: Express js backend (not included in this repo) with JWT-based auth
- **Data Fetching**: TanStack React Query v5
- **State Management**: Zustand (not setup yet)
- **Forms**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui (New York style) + Radix UI
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Package Manager**: pnpm

## Architecture & File Organization

This is a **Next.js App Router** dashboard for an affiliate e-commerce platform. Users are either `admin` or `vendor`, and the UI adapts accordingly.

### Directory Structure

```
app/                    # Next.js App Router pages
  ├── (routes)/         # Route groups for organization
  ├── api/              # API route handlers
  └── globals.css       # Global styles
components/             # React components (feature-organized)
  ├── ui/               # shadcn/ui base components
  └── [feature]/        # Feature-specific components
lib/                    # Core utilities and configurations
  ├── supabase/         # Supabase client utilities
  ├── schemas/          # Zod validation schemas
  └── utils.ts          # Shared utility functions
queries/                # TanStack Query functions
stores/                 # Zustand store definitions
types/                  # TypeScript type definitions
providers/              # React context providers
constants/              # Application constants
hooks/                  # Custom React hooks
```

### Import Order

1. React and Next.js imports
2. Third-party libraries
3. Internal components (`@/components`)
4. Internal utilities, hooks, types (`@/lib`, `@/hooks`, `@/types`)
5. Stores and queries (`@/stores`, `@/queries`)
6. Constants and assets (`@/constants`)
7. Types (use `type` keyword for type-only imports)

```typescript
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat/chat-interface";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useOrganizationContext } from "@/hooks/useOrganizationContext";

import { useUserStore } from "@/stores/userStore";
import { fetchWorkspaces } from "@/queries/workspaceQuery";

import { WORKSPACE_TABS } from "@/constants/workspace-tabs";

import type { Workspace } from "@/types/workspace-types";
```

## Component Patterns

### shadcn/ui Components

This project uses shadcn/ui (New York style). Always use existing UI components from `@/components/ui/`:

```typescript
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
```

**Key conventions:**

- Use `cn()` utility for conditional classes: `cn("base-classes", condition && "conditional-classes")`
- Follow Radix UI patterns for compound components
- Leverage Tailwind CSS variables for theming

### Component Structure

```typescript
// Feature component example
interface ComponentProps {
  workspaceId: string
  onSuccess?: () => void
}

export function FeatureComponent({ workspaceId, onSuccess }: ComponentProps) {
  // 1. Hooks (state, context, queries)
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // 2. Queries and mutations
  const { data, isLoading } = useQuery({
    queryKey: ["workspaces", workspaceId],
    queryFn: () => fetchWorkspace(workspaceId),
  })

  // 3. Event handlers
  const handleSubmit = async () => {
    // Implementation
    onSuccess?.()
  }

  // 4. Early returns for loading/error states
  if (isLoading) return <Skeleton />

  // 5. Render
  return (
    <div className="space-y-4">
      {/* Component content */}
    </div>
  )
}
```

### Server vs Client Components

- **Default to Server Components** unless client interactivity is needed
- Use `"use client"` directive only when necessary (state, effects, event handlers, browser APIs)
- Keep client components small and focused
- Prefer server components for data fetching when possible

```typescript
// Server Component (default)
async function WorkspacePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.from("workspaces").select("*").eq("slug", params.slug).single()

  return <WorkspaceView data={data} />
}

// Client Component (when needed)
"use client"

function InteractiveWorkspace({ data }: { data: Workspace }) {
  const [selected, setSelected] = useState<string>()
  // ... interactive logic
}
```

## State Management

### Zustand Stores

Use Zustand for global client-side state. Stores are located in `stores/`.

```typescript
// stores/exampleStore.ts
import { create } from "zustand";

interface ExampleState {
  data: string | null;
  setData: (data: string) => void;
  reset: () => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
  reset: () => set({ data: null }),
}));
```

**Usage in components:**

```typescript
import { useExampleStore } from "@/stores/exampleStore";

function Component() {
  const { data, setData } = useExampleStore();

  // Use selectors for performance
  const data = useExampleStore((state) => state.data);
}
```

**Key patterns:**

- Use `create` from zustand (not `createStore`)
- Define clear interfaces for state shape
- Include reset/clear functions for cleanup
- Use selectors to prevent unnecessary re-renders
- Hydrate stores on client mount when needed (see `lib/store-hydration.tsx`)

### Context Providers

For component tree-scoped state, use React Context:

```typescript
// providers/ExampleProvider.tsx
"use client"

import { createContext, useContext, useState } from "react"

interface ExampleContextValue {
  value: string
  setValue: (value: string) => void
}

const ExampleContext = createContext<ExampleContextValue | undefined>(undefined)

export function ExampleProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState("")

  return (
    <ExampleContext.Provider value={{ value, setValue }}>
      {children}
    </ExampleContext.Provider>
  )
}

export function useExample() {
  const context = useContext(ExampleContext)
  if (!context) throw new Error("useExample must be used within ExampleProvider")
  return context
}
```

## Data Fetching

### TanStack Query Patterns

Query functions are organized in `queries/` directory.

```typescript
// queries/workspaceQuery.ts
import { createClient } from "@/lib/supabase/client";

export async function fetchWorkspaces() {
  const supabase = createClient();
  const { data, error } = await supabase.from("workspaces").select("*");

  if (error) throw error;
  return data;
}

export async function createWorkspace(workspace: NewWorkspace) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .insert(workspace)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

**Using in components:**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchWorkspaces, createWorkspace } from "@/queries/workspaceQuery"

function WorkspaceList() {
  const queryClient = useQueryClient()

  // Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
  })

  // Mutation
  const mutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
      toast.success("Workspace created")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    // Component JSX
  )
}
```

**Key conventions:**

- Use descriptive query keys: `["resource", id, filters]`
- Handle loading and error states explicitly
- Invalidate related queries after mutations
- Use `toast` from `sonner` for user feedback
- Throw errors in query functions (don't return them)

## Form Handling

### React Hook Form + Zod

All forms use React Hook Form with Zod schema validation.

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// Define schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

function ExampleForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      description: "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    // Handle submission
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving..." : "Save"}
      </Button>
    </form>
  )
}
```

**Key patterns:**

- Define schemas in `lib/schemas/` for reusable validation
- Use `zodResolver` for form validation
- Extract types with `z.infer<typeof schema>`
- Show validation errors inline
- Disable submit button during submission
- Reset form after successful submission

## Authentication & Supabase

### Client Setup

Three Supabase client patterns exist:

1. **Browser Client** (`lib/supabase/client.ts`): For client components
2. **Server Client** (`lib/supabase/server.ts`): For server components and API routes
3. **Middleware Client** (`lib/supabase/middleware.ts`): For middleware auth checks

```typescript
// Client Component
"use client";
import { createClient } from "@/lib/supabase/client";

function ClientComponent() {
  const supabase = createClient();
  // Use supabase client
}

// Server Component
import { createClient } from "@/lib/supabase/server";

async function ServerComponent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Use supabase client
}

// API Route
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("table").select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### Authentication Patterns

- Use `middleware.ts` for route protection
- Store user state in `stores/userStore.ts`
- Check auth status with `supabase.auth.getUser()` (not `getSession()`)
- Handle auth redirects at the route level

## Styling Guidelines

### Tailwind CSS 4

- Use utility classes directly in components
- Leverage CSS variables defined in `globals.css` for theming
- Use `cn()` utility for conditional classes
- Prefer Tailwind utilities over custom CSS
- Use responsive modifiers: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Use dark mode classes: `dark:`

```typescript
import { cn } from "@/lib/utils"

<div className={cn(
  "rounded-lg border p-4",
  isActive && "bg-primary text-primary-foreground",
  size === "large" && "p-6"
)}>
  Content
</div>
```

### Theming

- Colors are defined as CSS variables in `globals.css`
- Use semantic color tokens: `background`, `foreground`, `primary`, `secondary`, `destructive`, `muted`, `accent`
- Components automatically support light/dark mode

## API Routes

### Route Conventions

```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Business logic
    const data = await fetchData();

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate input
    const validatedData = schema.parse(body);

    // Business logic
    const result = await createResource(validatedData);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

**Key patterns:**

- Always check authentication first
- Validate input with Zod schemas
- Use appropriate HTTP status codes
- Return consistent JSON error shapes
- Log errors with context
- Handle CORS if needed

## Code Quality Standards

### TypeScript

- Enable strict mode (already configured)
- Avoid `any` types; use `unknown` or proper types
- Use type inference where clear
- Define interfaces for complex shapes
- Export types separately from values using `type` keyword

```typescript
// Good
export type { Workspace, WorkspaceWithMembers };
export { fetchWorkspaces, createWorkspace };

// Component props
interface WorkspaceCardProps {
  workspace: Workspace;
  onDelete?: (id: string) => void;
}
```

### Error Handling

- Throw errors in data fetching functions
- Catch errors at component boundaries
- Show user-friendly error messages with `toast`
- Log detailed errors to console for debugging

```typescript
try {
  await mutation.mutateAsync(data);
  toast.success("Success!");
} catch (error) {
  console.error("Failed to update:", error);
  toast.error(error instanceof Error ? error.message : "Something went wrong");
}
```

### Performance

- Use React.memo() sparingly (only for expensive renders)
- Prefer Zustand selectors for fine-grained subscriptions
- Use Next.js Image component for images
- Lazy load heavy components with `dynamic`
- Use query key arrays properly to avoid over-fetching

### Testing

When writing tests:

- Focus on user interactions and outcomes
- Use React Testing Library patterns
- Mock Supabase client
- Test accessibility with screen reader queries

## Common Tasks

### Adding a New Page

1. Create route in `app/[route]/page.tsx`
2. Add middleware protection if needed
3. Create feature components in `components/[feature]/`
4. Add queries in `queries/[feature]Query.ts`
5. Update types in `types/[feature]-types.ts`

### Adding a New API Route

1. Create `app/api/[route]/route.ts`
2. Implement GET/POST/etc. handlers
3. Add authentication checks
4. Validate input with Zod schemas
5. Return typed responses

### Adding a New UI Component

1. Use shadcn CLI if it's a UI primitive: `pnpm dlx shadcn@latest add [component]`
2. Create feature components in `components/[feature]/`
3. Use existing UI components from `@/components/ui/`
4. Follow TypeScript patterns for props

### Adding State

1. Decide scope: Zustand (global) vs Context (tree) vs React Query (server)
2. Create store in `stores/` or provider in `providers/`
3. Use selectors for performance
4. Document state shape with TypeScript interfaces

## Environment Variables

Required environment variables (see `env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

## Deployment

- **Platform**: Cloudflare Workers (OpenNext)
- **Build**: `pnpm run build`
- **Deploy**: `pnpm run deploy`
- **Preview**: `pnpm run preview`

## Key Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm preview      # Preview Cloudflare build locally
pnpm deploy       # Deploy to Cloudflare
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)

### Organizational Principles

- **Feature-based grouping**: Components are organized by feature/domain (e.g., `admin-dashboard`, `chat`, `documents`)
- **Colocation**: Keep related files close together (components, types, queries)
- **Separation of concerns**: Separate data fetching (queries), state (stores), and UI (components)
- **Flat structure**: Avoid deep nesting; prefer flat, feature-based organization

**Routing structure:**

- `/login` → OTP-based auth flow (email → OTP → token)
- `/dashboard/*` → protected by `app/dashboard/layout.tsx` (redirects to `/login` if no user)
- Role-gated pages: `/dashboard/affiliates`, `/dashboard/admin`, `/dashboard/withdrawals` (admin only)

**Data flow:**

1. Auth state lives in `AppContext` (`lib/store.tsx`) — stores user, token, pendingEmail
2. Token is persisted to `localStorage` and auto-attached to every request via the Axios interceptor in `lib/api/client.ts`
3. Server state is managed by **React Query** (`lib/query-provider.tsx`) with a 1-min stale time, no refetch-on-focus
4. Mutations use `useApiMutation` from `hooks/use-query.ts`; queries follow the key factory pattern (`createQueryKeys`)

**API layer** (`lib/api/`):

- `client.ts` — Axios instance; call `setApiToken(token)` after login to update the auth header
- `auth.ts`, `products.ts`, `stock-movements.ts` — typed request functions consumed by hooks

## Key Conventions

**Path alias:** `@/*` maps to the repo root. Always use `@/` for imports, never relative `../../`.

**Component locations:**

- `components/ui/` — shadcn/ui primitives (do not hand-edit these; re-generate with `pnpm dlx shadcn@latest add <component>`)
- `components/layout/` — app shell (Sidebar, Topbar)
- `components/dashboard/` — feature-specific components

**Styling:**

- Tailwind CSS 4 with the `@tailwindcss/postcss` plugin (no `tailwind.config.*` file)
- shadcn **New York** style; base color `neutral`; all theming via CSS variables in `app/globals.css`
- Use `cn()` from `@/lib/utils` to merge class names
- Use CVA (`class-variance-authority`) for components with multiple visual variants

**React Query hooks** (`hooks/`):

- Query key factories via `createQueryKeys(entity)` — produces `.all()`, `.list(filters)`, `.detail(id)` keys
- Wrap mutations with `useApiMutation` to get consistent error handling and toast integration

**Forms:**

- `react-hook-form` + `zod` schemas + `@hookform/resolvers/zod`
- Wrap form fields in the shadcn `<Form>` / `<FormField>` components

**TypeScript types** are centralised in `lib/types.ts`:

- Enums: `UserRole` (`admin` | `vendor`), `OrderStatus`, `PaymentMethod`, `AffiliateType`
- Core interfaces: `User`, `Product`, `Order`, `Affiliate`, `Withdrawal`, `EarningEntry`, `StockMovement`

**`'use client'` directive:** Add it only when a component uses browser APIs, event handlers, or React hooks that don't work in RSC. Most page-level components in this app are client components.

**Environment variable:** `NEXT_PUBLIC_API_URL` sets the API base URL (defaults to `http://localhost:8000/ask`).
