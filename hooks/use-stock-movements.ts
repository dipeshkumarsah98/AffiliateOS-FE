import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStockMovement,
  getStockMovements,
  type CreateStockMovementPayload,
} from "@/lib/api/stock-movements";
import { queryKeys } from "@/hooks/use-query";

export function useStockMovementsQuery(productId?: string) {
  return useQuery({
    queryKey: queryKeys.stockMovements.list({ productId: productId ?? "" }),
    queryFn: () => getStockMovements(productId as string),
    enabled: Boolean(productId),
  });
}

export function useCreateStockMovementMutation(productId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStockMovementPayload) =>
      createStockMovement(payload),
    onSuccess: async () => {
      // Invalidate stock movements for this product
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stockMovements.list({ productId: productId ?? "" }),
      });

      // Invalidate all product queries to refresh the product list
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all(),
      });
    },
  });
}
