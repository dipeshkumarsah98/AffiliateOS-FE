---
applyTo: "**/*.ts,**/*.tsx"
---

# TanStack Query (React Query) v5 Instructions

## Overview

This project uses **TanStack Query v5.85.5** (React Query) for efficient server-state management, data fetching, caching, and synchronization. TanStack Query provides declarative, automatic management of asynchronous data with built-in caching, background updates, and optimistic updates.

## Project Configuration

### QueryClient Setup

The QueryClient is configured in `providers/QueryProvider.tsx` with the following defaults:

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry 4xx client errors
        if (
          error instanceof ApiError &&
          error?.status >= 400 &&
          error?.status < 500
        ) {
          return false;
        }
        return failureCount < 3; // Retry up to 3 times for other errors
      },
      refetchOnWindowFocus: false, // Don't refetch on window focus
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache data for 10 minutes
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
    },
  },
});
```

**Key Configuration:**

- **No retry for 4xx errors**: Client errors are not retried (e.g., validation errors, unauthorized)
- **Retry on 5xx errors**: Server errors are retried up to 3 times
- **5-minute stale time**: Data is considered fresh for 5 minutes before background refetch
- **10-minute garbage collection**: Cached data persists for 10 minutes after last use
- **No window focus refetch**: Prevents unnecessary refetches when user returns to tab

## File Organization

### Query Files Location

All query functions and hooks are organized in the `queries/` directory:

```
queries/
  ├── workspaceQuery.ts    # Workspace-related queries and mutations
  ├── chatQuery.ts         # Chat queries and mutations (just for example, file name can be different)
  ├── documentsQuery.ts    # Document upload/fetch/delete operations
  ├── organizationQuery.ts # Organization CRUD operations
  ├── invitationsQuery.ts  # Workspace invitation operations
  └── ...                  # Other domain-specific query files
```

**Conventions:**

- One file per domain/resource (workspace, chat, documents, etc.)
- Group related queries and mutations together
- Export both query functions and custom hooks
- Co-locate types and interfaces with their queries

## Query Patterns

### 1. Basic Query Hook Pattern

Use `useQuery` to fetch data from the server. Queries are identified by unique query keys.

```typescript
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/utils";
import { ROUTES } from "@/constants";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  // ... other fields
}

export interface WorkspacesResponse {
  data: {
    myWorkspaces: Workspace[];
  };
}

// Query hook
export function useWorkspaceQuery() {
  return useQuery({
    queryKey: ["workspaces"], // Unique identifier for this query
    queryFn: async (): Promise<WorkspacesResponse> => {
      const access_token = getAuthToken();
      const res = await fetch(ROUTES.MY_WORKSPACE, {
        method: "GET",
        headers: {
          access_token: access_token || "",
          accept: "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage =
          data.message || data.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage); // Always throw errors, don't return them
      }

      return data;
    },
    staleTime: 2 * 60 * 1000, // Optional: override default stale time
  });
}
```

**Usage in component:**

```typescript
import { useWorkspaceQuery } from "@/queries/workspaceQuery";

function WorkspacesPage() {
  const { data, isLoading, error } = useWorkspaceQuery();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  const workspaces = data?.data?.myWorkspaces ?? [];

  return (
    <div>
      {workspaces.map(workspace => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  );
}
```

### 2. Query with Parameters

For queries that depend on parameters (like IDs or filters), include them in the query key.

```typescript
export function useDocsQuery(workspaceSlug?: string) {
  return useQuery({
    queryKey: ["documents", workspaceSlug], // Include parameter in key
    queryFn: async () => {
      const access_token = getAuthToken();
      const res = await fetch(ROUTES.DOCUMENTS, {
        method: "GET",
        headers: {
          "x-tenant-id": workspaceSlug || "",
          access_token: access_token || "",
          accept: "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage =
          data.message || data.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      return data;
    },
  });
}
```

### 3. Conditional Queries (Enabled Option)

Use the `enabled` option to conditionally execute queries.

```typescript
export function useKnowledgebaseQuery(workspaceSlug: string, sector?: string) {
  return useQuery({
    queryKey: ["knowledgebase", workspaceSlug, sector ?? ""],
    queryFn: async (): Promise<Doc[]> => {
      // ... fetch logic
    },
    // Only run query when:
    // - On client side (typeof window !== "undefined")
    // - workspaceSlug exists
    // - sector is defined (not undefined)
    enabled:
      typeof window !== "undefined" && !!workspaceSlug && sector !== undefined,
    staleTime: 10_000, // 10 seconds
  });
}
```

**Common use cases for `enabled`:**

- Waiting for user authentication
- Dependent queries (query B needs data from query A)
- User-triggered queries (modal opens, tab selected)
- Client-side only queries

## Mutation Patterns

### 1. Basic Mutation Hook

Use `useMutation` for create, update, delete operations that modify server state.

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastUtils } from "@/lib/toast-utils";

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceData: {
      name: string;
      description?: string;
      sector?: string;
    }) => {
      const access_token = getAuthToken();
      const res = await fetch(ROUTES.CREATE_WORKSPACE, {
        method: "POST",
        headers: {
          access_token: access_token || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workspaceData),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage =
          data.message || data.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
```

**Usage in component:**

```typescript
import { useCreateWorkspace } from "@/queries/workspaceQuery";
import { toastUtils } from "@/lib/toast-utils";

function CreateWorkspaceDialog() {
  const createMutation = useCreateWorkspace();

  const handleSubmit = async (values: WorkspaceFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      toastUtils.success("Workspace created successfully");
      onClose();
    } catch (error) {
      console.error("Failed to create workspace:", error);
      toastUtils.error(
        error instanceof Error ? error.message : "Failed to create workspace"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button
        type="submit"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
```

### 2. Mutation with Callback Props

For reusable mutations with custom success/error handling:

```typescript
export function useDocDeleteMutation(
  workspaceSlug?: string,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const access_token = getAuthToken();
      const res = await fetch(ROUTES.DELETE_DOCUMENT(documentId), {
        method: "DELETE",
        headers: {
          accept: "application/json",
          "x-tenant-id": workspaceSlug || "",
          access_token: access_token || "",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      // For DELETE requests that return empty body
      const data = await res.json().catch(() => ({ success: true }));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onSuccess?.(); // Call optional callback
    },
  });
}
```

**Usage:**

```typescript
function DocumentList() {
  const deleteMutation = useDocDeleteMutation(workspaceSlug, () => {
    toastUtils.success("Document deleted");
    refetchDocuments();
  });

  const handleDelete = async (documentId: string) => {
    try {
      await deleteMutation.mutateAsync(documentId);
    } catch (error) {
      toastUtils.error("Failed to delete document");
    }
  };
}
```

### 3. File Upload Mutation

Special handling for FormData uploads:

```typescript
export function useDocUploadMutation(
  workspaceSlug?: string,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const access_token = getAuthToken();
      const res = await fetch(ROUTES.UPLOAD_DOCUMENTS, {
        method: "POST",
        body: formData, // Don't set Content-Type; browser sets it automatically
        headers: {
          "x-tenant-id": workspaceSlug || "",
          access_token: access_token || "",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage =
          data.message || data.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onSuccess?.();
    },
  });
}
```

## Query Keys Structure

Query keys uniquely identify queries and control caching. Follow these patterns:

### Query Key Hierarchy

```typescript
// List/collection queries - use array with resource name
["workspaces"]["documents"]["organizations"][
  // Individual item queries - include ID
  ("workspace", workspaceId)
][("document", documentId)][("organization", orgId)][
  // Filtered/parameterized queries - include all parameters
  ("documents", workspaceSlug)
][("knowledgebase", workspaceSlug, sector)][
  ("chat-history", workspaceSlug, sessionId)
][
  // Nested/related resources
  ("workspace-members", workspaceId)
][("workspace-invitations", workspaceId)];
```

### Query Key Best Practices

1. **Always use arrays**: Query keys must be arrays, even for single values

   ```typescript
   // ✅ Correct
   queryKey: ["workspaces"];

   // ❌ Wrong
   queryKey: "workspaces";
   ```

2. **Include all parameters that affect the result**:

   ```typescript
   // ✅ Correct - includes all filter parameters
   queryKey: ["documents", workspaceSlug, { status: "active", page: 1 }];

   // ❌ Wrong - missing filter parameters
   queryKey: ["documents"];
   ```

3. **Order matters**: Use consistent ordering

   ```typescript
   // ✅ Correct - consistent order
   queryKey: ["resource", id, filters];

   // ❌ Wrong - inconsistent order
   queryKey: [filters, "resource", id];
   ```

4. **Use empty string or null for optional parameters**:
   ```typescript
   queryKey: ["knowledgebase", workspaceSlug, sector ?? ""];
   ```

## Error Handling

### Query Function Error Pattern

**Always throw errors in query/mutation functions**. Never return error objects.

```typescript
// ✅ Correct - throw errors
queryFn: async () => {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    const errorMessage =
      data.message || data.error || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(errorMessage);
  }

  return data;
};

// ❌ Wrong - returning error object
queryFn: async () => {
  const res = await fetch(url);
  if (!res.ok) {
    return { error: "Something went wrong" }; // DON'T DO THIS
  }
  return data;
};
```

### Handling Errors in Components

```typescript
function Component() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["resource"],
    queryFn: fetchResource,
  });

  // Handle error state
  if (error) {
    return (
      <div className="text-destructive">
        {error instanceof Error ? error.message : "An error occurred"}
      </div>
    );
  }

  if (isLoading) return <Skeleton />;

  return <div>{/* Render data */}</div>;
}
```

### Mutation Error Handling

```typescript
function Component() {
  const mutation = useMutation({
    mutationFn: createResource,
    onError: (error) => {
      // Optional: global error handling
      console.error("Mutation error:", error);
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      await mutation.mutateAsync(values);
      toastUtils.success("Success!");
    } catch (error) {
      // Handle error in component
      console.error("Failed to create:", error);
      toastUtils.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  };
}
```

## Cache Invalidation

After mutations that modify server state, invalidate related queries to trigger refetch.

### Invalidate All Instances of a Query

```typescript
// Invalidate all queries with this key
queryClient.invalidateQueries({ queryKey: ["workspaces"] });

// This will refetch:
// - ["workspaces"]
// - ["workspaces", "123"]
// - ["workspaces", { filter: "active" }]
```

### Invalidate Specific Query

```typescript
// Only invalidate this exact query
queryClient.invalidateQueries({
  queryKey: ["workspace", workspaceId],
  exact: true,
});
```

### Invalidate Multiple Related Queries

```typescript
onSuccess: () => {
  // Invalidate multiple related queries
  queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  queryClient.invalidateQueries({
    queryKey: ["workspace-members", workspaceId],
  });
  queryClient.invalidateQueries({ queryKey: ["organizations"] });
};
```

### Manual Cache Updates (Advanced)

For immediate UI updates without waiting for refetch:

```typescript
onSuccess: (newWorkspace) => {
  // Update cache directly
  queryClient.setQueryData(["workspaces"], (old: WorkspacesResponse) => ({
    ...old,
    data: {
      myWorkspaces: [...old.data.myWorkspaces, newWorkspace],
    },
  }));
};
```

## TypeScript Patterns

### Type Query Responses

Always define TypeScript interfaces for API responses:

```typescript
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface WorkspacesResponse {
  data: {
    myWorkspaces: Workspace[];
  };
}

export function useWorkspaceQuery() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async (): Promise<WorkspacesResponse> => {
      // Query will be typed as UseQueryResult<WorkspacesResponse>
    },
  });
}
```

### Type Mutation Results

```typescript
interface CreateWorkspacePayload {
  name: string;
  description?: string;
  sector?: string;
}

interface CreateWorkspaceResponse {
  data: Workspace;
}

export function useCreateWorkspace() {
  return useMutation<
    CreateWorkspaceResponse, // TData - success response type
    Error, // TError - error type
    CreateWorkspacePayload, // TVariables - mutation function parameters
    unknown // TContext - context type (for optimistic updates)
  >({
    mutationFn: async (payload) => {
      // ...
    },
  });
}
```

### Type-Safe Query Keys

For better type safety with query keys, define constants:

```typescript
// constants/queryKeys.ts
export const queryKeys = {
  workspaces: ["workspaces"] as const,
  workspace: (id: string) => ["workspace", id] as const,
  documents: (workspaceSlug: string) => ["documents", workspaceSlug] as const,
  chatHistory: (workspaceSlug: string, sessionId?: string) =>
    ["chat-history", workspaceSlug, sessionId ?? ""] as const,
} as const;

// Usage
queryKey: queryKeys.workspace(workspaceId);
```

## Common Patterns

### 1. Dependent Queries

Query B depends on data from Query A:

```typescript
function WorkspaceSettings() {
  // First query
  const { data: workspace } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: fetchWorkspace,
  });

  // Second query depends on first
  const { data: settings } = useQuery({
    queryKey: ["workspace-settings", workspace?.id],
    queryFn: () => fetchWorkspaceSettings(workspace!.id),
    enabled: !!workspace?.id, // Only run when workspace exists
  });
}
```

### 2. Pagination

```typescript
function usePaginatedDocuments(workspaceSlug: string, page: number) {
  return useQuery({
    queryKey: ["documents", workspaceSlug, { page }],
    queryFn: () => fetchDocuments(workspaceSlug, page),
    keepPreviousData: true, // Keep old data while fetching new page
  });
}
```

### 3. Polling / Auto-Refetch

```typescript
function useLiveData() {
  return useQuery({
    queryKey: ["live-data"],
    queryFn: fetchLiveData,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue refetching when tab not focused
  });
}
```

### 4. Optimistic Updates

Update UI immediately before server confirms:

```typescript
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkspace,
    onMutate: async (newWorkspace, context) => {
      // Cancel outgoing refetches
      await context.client.cancelQueries({
        queryKey: ["workspace", newWorkspace.id],
      });

      // Snapshot previous value
      const previousWorkspace = context.client.getQueryData([
        "workspace",
        newWorkspace.id,
      ]);

      // Optimistically update cache
      context.client.setQueryData(["workspace", newWorkspace.id], newWorkspace);

      // Return context with snapshot
      return { previousWorkspace };
    },
    onError: (err, newWorkspace, onMutateResult, context) => {
      // Rollback on error
      context.client.setQueryData(
        ["workspace", newWorkspace.id],
        onMutateResult.previousWorkspace,
      );
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      // Always refetch after mutation settles
      context.client.invalidateQueries({
        queryKey: ["workspace", variables.id],
      });
    },
  });
}
```

## Component Integration

### Hook Usage States

```typescript
function Component() {
  const {
    data, // The query data (undefined if loading/error)
    error, // Error object if query failed
    isLoading, // Initial loading state (no cached data)
    isFetching, // Fetching state (may have cached data)
    isSuccess, // Query succeeded
    isError, // Query failed
    refetch, // Manual refetch function
  } = useQuery({
    queryKey: ["resource"],
    queryFn: fetchResource,
  });
}
```

### Mutation States

```typescript
function Component() {
  const {
    mutate, // Trigger mutation with callbacks
    mutateAsync, // Trigger mutation returning promise
    isPending, // Mutation in progress (replaces isLoading in v5)
    isSuccess, // Mutation succeeded
    isError, // Mutation failed
    data, // Mutation response data
    error, // Mutation error
    reset, // Reset mutation state
  } = useMutation({
    mutationFn: createResource,
  });
}
```

## Dos and Don'ts

### ✅ DO

1. **Always throw errors in query functions**

   ```typescript
   if (!res.ok) throw new Error(errorMessage);
   ```

2. **Include all dependencies in query keys**

   ```typescript
   queryKey: ["documents", workspaceSlug, filters];
   ```

3. **Invalidate queries after mutations**

   ```typescript
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ["workspaces"] });
   };
   ```

4. **Use `enabled` option for conditional queries**

   ```typescript
   enabled: !!userId && !!workspaceId;
   ```

5. **Handle loading and error states in components**

   ```typescript
   if (isLoading) return <Skeleton />;
   if (error) return <ErrorMessage />;
   ```

6. **Use TypeScript for type safety**

   ```typescript
   queryFn: async (): Promise<WorkspacesResponse> => {};
   ```

7. **Use `mutateAsync` when you need promise-based control flow**

   ```typescript
   try {
     await mutation.mutateAsync(data);
     router.push("/success");
   } catch (error) {
     // handle error
   }
   ```

8. **Use toast notifications for user feedback**
   ```typescript
   toastUtils.success("Workspace created");
   toastUtils.error("Failed to create workspace");
   ```

### ❌ DON'T

1. **Don't return errors from query functions**

   ```typescript
   // ❌ Wrong
   return { error: "Something went wrong" };
   ```

2. **Don't forget to include parameters in query keys**

   ```typescript
   // ❌ Wrong - missing workspaceSlug
   queryKey: ["documents"];
   ```

3. **Don't forget to invalidate after mutations**

   ```typescript
   // ❌ Wrong - stale data
   onSuccess: () => {
     // No invalidation
   };
   ```

4. **Don't use `useQuery` for mutations**

   ```typescript
   // ❌ Wrong
   const { data } = useQuery({
     queryKey: ["create-workspace"],
     queryFn: createWorkspace, // This is a mutation, use useMutation!
   });
   ```

5. **Don't call query hooks conditionally**

   ```typescript
   // ❌ Wrong - breaks Rules of Hooks
   if (userId) {
     const { data } = useQuery({ queryKey: ["user", userId], ... });
   }

   // ✅ Correct - use enabled option
   const { data } = useQuery({
     queryKey: ["user", userId],
     enabled: !!userId,
     ...
   });
   ```

6. **Don't destructure `mutate` and use it outside the component**

   ```typescript
   // ❌ Wrong
   const { mutate } = useMutation({ ... });
   const createWorkspace = mutate; // Don't do this

   // ✅ Correct
   const mutation = useMutation({ ... });
   const createWorkspace = mutation.mutate;
   ```

## Performance Tips

1. **Set appropriate `staleTime`**: Reduce refetches for data that doesn't change often

   ```typescript
   staleTime: 5 * 60 * 1000; // 5 minutes
   ```

2. **Use query selectors for derived data**: Transform data in the hook to prevent re-renders

   ```typescript
   const { data: activeWorkspaces } = useQuery({
     queryKey: ["workspaces"],
     queryFn: fetchWorkspaces,
     select: (data) => data.data.myWorkspaces.filter((w) => w.isActive),
   });
   ```

3. **Use `keepPreviousData` for pagination**: Smooth UX during page transitions

   ```typescript
   keepPreviousData: true;
   ```

4. **Prefetch data**: Load data before it's needed

   ```typescript
   queryClient.prefetchQuery({
     queryKey: ["workspace", workspaceId],
     queryFn: () => fetchWorkspace(workspaceId),
   });
   ```

5. **Use structural sharing**: TanStack Query automatically prevents unnecessary re-renders by comparing query results structurally

## Migration from Earlier Versions

If migrating from v3/v4 to v5:

### Key Changes in v5

1. **`cacheTime` renamed to `gcTime`** (Garbage Collection Time)

   ```typescript
   // v4
   cacheTime: 10 * 60 * 1000;

   // v5
   gcTime: 10 * 60 * 1000;
   ```

2. **`isLoading` vs `isPending`**:
   - `isLoading`: True only on initial load (no cached data)
   - `isPending`: True whenever query is executing (replaces old `isLoading` for mutations)

3. **Mutation callbacks receive context as a parameter**:

   ```typescript
   // v5
   onMutate: async (variables, context) => {
     await context.client.cancelQueries({ queryKey: ["todos"] });
     // ...
   };
   ```

4. **`mutate` and `mutateAsync` are more clearly separated**:
   - Use `mutate` with callbacks (`onSuccess`, `onError`)
   - Use `mutateAsync` with `try/catch` and promises

## Debugging

### React Query Devtools

Install and use devtools for debugging:

```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Common Issues

1. **Query not refetching**: Check `staleTime` and `enabled` options
2. **Infinite loops**: Ensure query keys are stable (don't create new objects inline)
3. **Stale data after mutation**: Remember to invalidate queries in `onSuccess`
4. **TypeScript errors**: Ensure return types match `queryFn` Promise type

## Additional Resources

- [TanStack Query v5 Documentation](https://tanstack.com/query/v5/docs/framework/react/overview)
- [TanStack Query v5 Migration Guide](https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5)
- [Query Keys Guide](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys)
- [Optimistic Updates Guide](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates)

---

**Last Updated**: March 31, 2026  
**TanStack Query Version**: 5.85.5
