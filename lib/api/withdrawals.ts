import { apiClient } from "./client";

export type WithdrawalStatusAPI = "PENDING" | "APPROVED" | "REJECTED";

export interface WithdrawalListItem {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  status: WithdrawalStatusAPI;
  remarks: string | null;
  transactionProof: string | null;
  requestedAt: string;
  processedAt: string | null;
  rejectionReason: string | null;
  processedBy: string | null;
}

export interface GetWithdrawalsParams {
  page: number;
  limit: number;
  status?: WithdrawalStatusAPI;
}

export interface GetWithdrawalsResponse {
  items: WithdrawalListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface WithdrawalBalanceResponse {
  totalEarnings: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  availableBalance: number;
}

export interface CreateWithdrawalPayload {
  amount: number;
  remarks?: string;
}

export async function getWithdrawals(params: GetWithdrawalsParams) {
  const response = await apiClient.get<GetWithdrawalsResponse>(
    "/vendors/withdrawals",
    {
      params: {
        page: params.page,
        limit: params.limit,
        ...(params.status ? { status: params.status } : {}),
      },
    },
  );
  return response.data;
}

export async function getWithdrawalBalance() {
  const response = await apiClient.get<WithdrawalBalanceResponse>(
    "/vendors/withdrawals/balance",
  );
  return response.data;
}

export async function createWithdrawal(payload: CreateWithdrawalPayload) {
  const response = await apiClient.post<WithdrawalListItem>(
    "/vendors/withdrawals",
    payload,
  );
  return response.data;
}
