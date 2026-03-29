import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MutationFunction } from "@tanstack/react-query";

/**
 * Factory function to create query keys with type safety
 * Usage: const userKeys = createQueryKeys('users')
 * userKeys.all() => ['users']
 * userKeys.lists() => ['users', 'list']
 * userKeys.list(filters) => ['users', 'list', filters]
 * userKeys.details() => ['users', 'detail']
 * userKeys.detail(id) => ['users', 'detail', id]
 */
export function createQueryKeys<T extends string>(feature: T) {
  return {
    all: () => [feature] as const,
    lists: () => [feature, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [feature, "list", filters] as const,
    details: () => [feature, "detail"] as const,
    detail: (id: string | number) => [feature, "detail", id] as const,
  };
}

// Pre-defined query keys for common features
export const queryKeys = {
  users: createQueryKeys("users"),
  orders: createQueryKeys("orders"),
  products: createQueryKeys("products"),
  stockMovements: createQueryKeys("stockMovements"),
  affiliates: createQueryKeys("affiliates"),
  withdrawals: createQueryKeys("withdrawals"),
  earnings: createQueryKeys("earnings"),
};

interface UseApiMutationOptions<TData, TVariables> {
  mutationFn: MutationFunction<TData, TVariables>;
  invalidateKeys?: readonly unknown[][];
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for API mutations with automatic cache invalidation
 */
export function useApiMutation<TData, TVariables>({
  mutationFn,
  invalidateKeys,
  onSuccess,
  onError,
}: UseApiMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      // Invalidate specified query keys on success
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      onSuccess?.(data);
    },
    onError,
  });
}

/**
 * Hook to prefetch data (useful for hover states, pagination)
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  return <TData>(
    queryKey: unknown[],
    queryFn: () => Promise<TData>,
    options?: { staleTime?: number },
  ) => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: options?.staleTime ?? 60 * 1000,
    });
  };
}

/**
 * Hook to invalidate queries manually
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return (queryKey: unknown[]) => {
    queryClient.invalidateQueries({ queryKey });
  };
}

/**
 * Hook to reset queries (clear cache and refetch)
 */
export function useResetQueries() {
  const queryClient = useQueryClient();

  return (queryKey?: unknown[]) => {
    if (queryKey) {
      queryClient.resetQueries({ queryKey });
    } else {
      queryClient.resetQueries();
    }
  };
}
