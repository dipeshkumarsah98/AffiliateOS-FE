import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getWithdrawals,
  getWithdrawalBalance,
  createWithdrawal,
  type GetWithdrawalsParams,
  type CreateWithdrawalPayload,
  type WithdrawalListItem,
} from "@/lib/api/withdrawals";
import { queryKeys, useApiMutation } from "@/hooks/use-query";

export function useWithdrawalsQuery(params: GetWithdrawalsParams) {
  return useQuery({
    queryKey: queryKeys.withdrawals.list({
      page: params.page,
      limit: params.limit,
      status: params.status ?? "",
    }),
    queryFn: () => getWithdrawals(params),
    placeholderData: keepPreviousData,
  });
}

export function useWithdrawalBalanceQuery() {
  return useQuery({
    queryKey: [...queryKeys.withdrawals.all(), "balance"],
    queryFn: () => getWithdrawalBalance(),
  });
}

export function useCreateWithdrawal() {
  return useApiMutation<WithdrawalListItem, CreateWithdrawalPayload>({
    mutationFn: createWithdrawal,
    invalidateKeys: [[...queryKeys.withdrawals.all()]],
  });
}
