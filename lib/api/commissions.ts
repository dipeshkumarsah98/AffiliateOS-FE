import { apiClient } from "./client";

export interface CommissionProduct {
  id: string;
  title: string;
  slug: string;
  images: string[];
  price: number;
}

export interface CommissionItem {
  affiliateLinkId: string;
  code: string;
  product: CommissionProduct;
  totalCommission: number;
  totalOrders: number;
  completedOrders: number;
  lastCompletedOrderDate: string;
  commissionType: "PERCENTAGE" | "FIXED";
  commissionValue: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  isActive: boolean;
  createdAt: string;
}

export type CommissionSortBy =
  | "totalCommission"
  | "orderCount"
  | "lastOrderDate"
  | "code";
export type SortOrder = "asc" | "desc";

export interface GetCommissionsParams {
  page: number;
  limit: number;
  sortBy?: CommissionSortBy;
  sortOrder?: SortOrder;
  isActive?: boolean;
}

export interface GetCommissionsResponse {
  items: CommissionItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CommissionSummary {
  totalCommission: number;
  activeLinks: number;
  totalOrders: number;
  completedOrders: number;
}

export async function getCommissions(params: GetCommissionsParams) {
  const response = await apiClient.get<GetCommissionsResponse>(
    "/vendors/commissions",
    {
      params: {
        page: params.page,
        limit: params.limit,
        ...(params.sortBy ? { sortBy: params.sortBy } : {}),
        ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
        ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      },
    },
  );
  return response.data;
}

export async function getCommissionSummary() {
  const response = await apiClient.get<CommissionSummary>(
    "/vendors/commissions/summary",
  );
  return response.data;
}
