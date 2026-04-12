import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getAdminWithdrawalStats,
  getAdminWithdrawals,
  getAdminWithdrawalDetail,
  approveWithdrawal,
  rejectWithdrawal,
  type AdminGetWithdrawalsParams,
  type ApproveWithdrawalPayload,
  type RejectWithdrawalPayload,
} from "@/lib/api/admin-withdrawals";
import { queryKeys, useApiMutation } from "@/hooks/use-query";

export function useAdminWithdrawalStatsQuery() {
  return useQuery({
    queryKey: [...queryKeys.adminWithdrawals.all(), "stats"],
    queryFn: getAdminWithdrawalStats,
  });
}

export function useAdminWithdrawalsQuery(params: AdminGetWithdrawalsParams) {
  return useQuery({
    queryKey: queryKeys.adminWithdrawals.list({
      page: params.page,
      limit: params.limit,
      status: params.status ?? "",
      search: params.search ?? "",
    }),
    queryFn: () => getAdminWithdrawals(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminWithdrawalDetailQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.adminWithdrawals.detail(id!),
    queryFn: () => getAdminWithdrawalDetail(id!),
    enabled: !!id,
  });
}

export function useApproveWithdrawalMutation({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
} = {}) {
  return useApiMutation<
    Awaited<ReturnType<typeof approveWithdrawal>>,
    { id: string; payload: ApproveWithdrawalPayload }
  >({
    mutationFn: ({ id, payload }) => approveWithdrawal(id, payload),
    invalidateKeys: [
      [...queryKeys.adminWithdrawals.all()],
      [...queryKeys.adminWithdrawals.all(), "stats"],
    ],
    onSuccess,
    onError,
  });
}

export function useRejectWithdrawalMutation({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
} = {}) {
  return useApiMutation<
    Awaited<ReturnType<typeof rejectWithdrawal>>,
    { id: string; payload: RejectWithdrawalPayload }
  >({
    mutationFn: ({ id, payload }) => rejectWithdrawal(id, payload),
    invalidateKeys: [
      [...queryKeys.adminWithdrawals.all()],
      [...queryKeys.adminWithdrawals.all(), "stats"],
    ],
    onSuccess,
    onError,
  });
}
