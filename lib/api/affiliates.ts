import { apiClient } from "./client";

// Enums matching backend expectations (UPPERCASED)
export type AffiliateTypeAPI =
  | "INFLUENCER"
  | "RESELLER"
  | "REFERRAL"
  | "PARTNER";

export type DiscountTypeAPI = "PERCENTAGE" | "FIXED";
export type CommissionTypeAPI = "PERCENTAGE" | "FIXED";

// POST /affiliates payload
export interface CreateAffiliatePayload {
  vendor: {
    name: string;
    email: string;
    affiliateType: AffiliateTypeAPI;
    contact: string;
    address: string;
    bankName: string;
    accountNumber: string;
  };
  affiliate: {
    productId: string;
    code: string;
    discountType: DiscountTypeAPI;
    discountValue: number;
    commissionType: CommissionTypeAPI;
    commissionValue: number;
  };
}

// PATCH /affiliates/:id payload
export interface UpdateAffiliatePayload {
  affiliate: {
    productId: string;
    code: string;
    discountType: DiscountTypeAPI;
    discountValue: number;
    commissionType: CommissionTypeAPI;
    commissionValue: number;
  };
}

// GET /affiliates/:id response
export interface AffiliateDetail {
  id: string;
  code: string;
  vendorId: string;
  productId: string;
  discountType: DiscountTypeAPI;
  discountValue: number;
  commissionType: CommissionTypeAPI;
  commissionValue: number;
  isActive: boolean;
  createdAt: string;
  product: AffiliateProductSummary;
  vendor: AffiliateVendorSummary;
}

// GET /affiliates/generate-code response
export interface GenerateCodeResponse {
  code: string;
}

// ============= GET /affiliates LIST TYPES =============

// Nested product summary in list item
export interface AffiliateProductSummary {
  id: string;
  title: string;
  slug: string;
}

// Vendor extras in list item
export interface AffiliateVendorExtras {
  name: string;
  bankName: string;
  accountNumber: string;
  affiliateType: AffiliateTypeAPI;
}

// Vendor in list item
export interface AffiliateVendorSummary {
  id: string;
  name: string;
  email: string;
  extras: AffiliateVendorExtras;
}

// Single item in GET /affiliates response
export interface AffiliateListItem {
  id: string;
  code: string;
  vendorId: string;
  productId: string;
  discountType: DiscountTypeAPI;
  discountValue: number;
  commissionType: CommissionTypeAPI;
  commissionValue: number;
  isActive: boolean;
  createdAt: string;
  product: AffiliateProductSummary;
  vendor: AffiliateVendorSummary;
}

// Stats included in list response
export interface AffiliateListStats {
  totalAffiliates: number;
  active: number;
  inactive: number;
  productsLinked: number;
}

export interface GetAffiliatesParams {
  page: number;
  limit: number;
  search?: string;
  affiliateType?: AffiliateTypeAPI;
  sortBy?: "createdAt" | "discountValue" | "commissionValue";
  sortOrder?: "asc" | "desc";
}

export interface GetAffiliatesResponse {
  items: AffiliateListItem[];
  total: number;
  page: number;
  limit: number;
  stats: AffiliateListStats;
}

// ============= API FUNCTIONS =============

/**
 * GET /affiliates - Fetch paginated affiliates list
 */
export async function getAffiliates(params: GetAffiliatesParams) {
  const response = await apiClient.get<GetAffiliatesResponse>("/affiliates", {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.search ? { search: params.search } : {}),
      ...(params.affiliateType ? { affiliateType: params.affiliateType } : {}),
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    },
  });
  return response.data;
}

/**
 * GET /affiliates/:id - Fetch single affiliate detail
 */
export async function getAffiliate(id: string) {
  const response = await apiClient.get<AffiliateDetail>(`/affiliates/${id}`);
  return response.data;
}

/**
 * POST /affiliates - Create new affiliate (vendor + affiliate entry)
 */
export async function createAffiliate(payload: CreateAffiliatePayload) {
  const response = await apiClient.post<AffiliateDetail>(
    "/affiliates",
    payload,
  );
  return response.data;
}

/**
 * PATCH /affiliates/:id - Update affiliate entry (vendor cannot be updated)
 */
export async function updateAffiliate(
  id: string,
  payload: UpdateAffiliatePayload,
) {
  const response = await apiClient.patch<AffiliateDetail>(
    `/affiliates/${id}`,
    payload,
  );
  return response.data;
}

/**
 * GET /affiliates/generate-code - Generate unique affiliate code
 */
export async function generateAffiliateCode() {
  const response = await apiClient.get<GenerateCodeResponse>(
    "/affiliates/generate-code",
  );
  return response.data;
}
