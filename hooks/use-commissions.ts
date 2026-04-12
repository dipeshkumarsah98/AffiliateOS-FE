import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getCommissions,
  getCommissionSummary,
  type GetCommissionsParams,
} from "@/lib/api/commissions";
import { queryKeys } from "@/hooks/use-query";

export function useCommissionsQuery(params: GetCommissionsParams) {
  console.log(
    "useCommissionsQuery params",
    params,
    params.isActive !== undefined ? params.isActive : "all",
  );
  return useQuery({
    queryKey: queryKeys.commissions.list({
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy ?? "",
      sortOrder: params.sortOrder ?? "",
      isActive: params.isActive !== undefined ? params.isActive : "all",
    }),
    queryFn: () => getCommissions(params),
    placeholderData: keepPreviousData,
  });
}

export function useCommissionSummaryQuery() {
  return useQuery({
    queryKey: [...queryKeys.commissions.all(), "summary"],
    queryFn: () => getCommissionSummary(),
  });
}
