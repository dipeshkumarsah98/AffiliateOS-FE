import { apiClient } from "./client";

// Re-use WithdrawalStatusAPI from vendor withdrawals
export type { WithdrawalStatusAPI } from "./withdrawals";

export interface AdminWithdrawalVendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  extras: {
    bankName: string;
    accountNumber: string;
    affiliateType: string;
  };
}

export interface AdminWithdrawalAdmin {
  id: string;
  name: string;
  email: string;
}

export interface AdminWithdrawalListItem {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks: string | null;
  transactionProof: string | null;
  requestedAt: string;
  processedAt: string | null;
  rejectionReason: string | null;
  processedBy: string | null;
  vendor: Omit<AdminWithdrawalVendor, "phone">;
}

export interface AdminWithdrawalDetail {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks: string | null;
  transactionProof: string | null;
  requestedAt: string;
  processedAt: string | null;
  rejectionReason: string | null;
  processedBy: string | null;
  vendor: AdminWithdrawalVendor;
  admin: AdminWithdrawalAdmin | null;
}

export interface AdminWithdrawalStatsResponse {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface AdminGetWithdrawalsParams {
  page: number;
  limit: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  search?: string;
}

export interface AdminGetWithdrawalsResponse {
  items: AdminWithdrawalListItem[];
  total: number;
  page: number;
  limit: number;
}

export async function getAdminWithdrawalStats() {
  const response = await apiClient.get<AdminWithdrawalStatsResponse>(
    "/admin/withdrawals/stats",
  );
  return response.data;
}

export async function getAdminWithdrawals(params: AdminGetWithdrawalsParams) {
  const response = await apiClient.get<AdminGetWithdrawalsResponse>(
    "/admin/withdrawals",
    {
      params: {
        page: params.page,
        limit: params.limit,
        ...(params.status ? { status: params.status } : {}),
        ...(params.search && params.search.trim()
          ? { search: params.search.trim() }
          : {}),
      },
    },
  );
  return response.data;
}

export async function getAdminWithdrawalDetail(id: string) {
  const response = await apiClient.get<AdminWithdrawalDetail>(
    `/admin/withdrawals/${id}`,
  );
  return response.data;
}

export interface ApproveWithdrawalPayload {
  transactionProof: string;
  remarks: string;
}

export interface RejectWithdrawalPayload {
  rejectionReason: string;
}

export async function approveWithdrawal(
  id: string,
  payload: ApproveWithdrawalPayload,
) {
  const response = await apiClient.patch<AdminWithdrawalDetail>(
    `/admin/withdrawals/${id}/approve`,
    payload,
  );
  return response.data;
}

export async function rejectWithdrawal(
  id: string,
  payload: RejectWithdrawalPayload,
) {
  const response = await apiClient.patch<AdminWithdrawalDetail>(
    `/admin/withdrawals/${id}/reject`,
    payload,
  );
  return response.data;
}
