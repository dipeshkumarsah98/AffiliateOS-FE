import { apiClient } from "./client";

// ── Types ───────────────────────────────────────────────────────────────────

export interface CodVerificationUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface CodVerificationAdmin {
  id: string;
  name: string;
  email: string;
}

export interface CodVerification {
  id: string;
  orderId: string;
  verifiedBy: string;
  verificationStatus: string; // "PENDING" | "CONFIRMED" | "REJECTED"
  customerResponse: string | null;
  remarks: string | null;
  verifiedAt: string | null;
  createdAt: string;
  admin: CodVerificationAdmin;
}

export interface CodVerificationItem {
  id: string;
  userId: string;
  orderNumber: string;
  status: string;
  affiliateId: string | null;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingAddressId: string;
  billingAddressId: string;
  paymentMethod: string;
  notes: string | null;
  additionalInfo: unknown | null;
  updatedAt: string;
  createdAt: string;
  createdBy: string | null;
  user: CodVerificationUser;
  verification: CodVerification | null;
}

export interface CodVerificationsListResponse {
  items: CodVerificationItem[];
  total: number;
  page: number;
  limit: number;
}

export interface FetchCodVerificationsParams {
  status?: string; // "PENDING" | "CONFIRMED" | "REJECTED"
  fromDate?: string; // yyyy-MM-dd
  toDate?: string; // yyyy-MM-dd
  search?: string;
  page?: number;
  limit?: number;
}

export interface CodVerificationStatsResponse {
  totalCODOrders: number;
  pendingVerification: number;
  verifiedToday: number;
  rejectionRate: string; // e.g. "12.5%"
}

export interface SubmitCodVerificationPayload {
  orderId: string;
  verificationStatus: "CONFIRMED" | "REJECTED";
  customerResponse: string;
  remarks?: string;
}

// ── API Functions ───────────────────────────────────────────────────────────

export async function fetchCodVerifications(
  params?: FetchCodVerificationsParams,
): Promise<CodVerificationsListResponse> {
  const response = await apiClient.get("/cod-verifications", { params });
  return response.data;
}

export async function fetchCodVerificationStats(): Promise<CodVerificationStatsResponse> {
  const response = await apiClient.get("/cod-verifications/stats");
  return response.data;
}

export async function submitCodVerification(
  payload: SubmitCodVerificationPayload,
): Promise<void> {
  await apiClient.post("/cod-verifications", payload);
}
