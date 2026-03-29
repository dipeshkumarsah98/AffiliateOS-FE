import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getProducts, type GetProductsParams } from "@/lib/api/products";
import { queryKeys } from "@/hooks/use-query";

export function useProductsQuery(params: GetProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list({
      page: params.page,
      limit: params.limit,
      search: params.search ?? "",
    }),
    queryFn: () => getProducts(params),
    placeholderData: keepPreviousData,
  });
}
