import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  getAffiliate,
  getAffiliates,
  createAffiliate,
  updateAffiliate,
  generateAffiliateCode,
  type CreateAffiliatePayload,
  type UpdateAffiliatePayload,
  type GetAffiliatesParams,
} from "@/lib/api/affiliates";
import { queryKeys, useApiMutation } from "@/hooks/use-query";

/**
 * Query hook to fetch paginated list of affiliates
 * Uses keepPreviousData for smooth pagination transitions
 * @param params - Query parameters (page, limit, search, affiliateType, sortBy, sortOrder)
 */
export function useAffiliatesQuery(params: GetAffiliatesParams) {
  return useQuery({
    queryKey: queryKeys.affiliates.list({
      page: params.page,
      limit: params.limit,
      search: params.search ?? "",
      affiliateType: params.affiliateType ?? "",
    }),
    queryFn: () => getAffiliates(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Query hook to fetch single affiliate detail (for edit mode)
 * @param id - Affiliate ID
 * @param enabled - Whether to enable the query (default: true if id is truthy)
 */
export function useAffiliateDetail(
  id: string | null | undefined,
  enabled?: boolean,
) {
  return useQuery({
    queryKey: queryKeys.affiliates.detail(id ?? ""),
    queryFn: () => getAffiliate(id!),
    enabled: enabled !== undefined ? enabled : !!id,
  });
}

/**
 * Mutation hook to create a new affiliate
 * Invalidates affiliates list on success
 */
export function useCreateAffiliate() {
  return useApiMutation<unknown, CreateAffiliatePayload>({
    mutationFn: createAffiliate,
    invalidateKeys: [[...queryKeys.affiliates.all()]],
  });
}

/**
 * Mutation hook to update an existing affiliate
 * Invalidates affiliates list and detail on success
 */
export function useUpdateAffiliate(id: string) {
  return useApiMutation<unknown, UpdateAffiliatePayload>({
    mutationFn: (payload) => updateAffiliate(id, payload),
    invalidateKeys: [
      [...queryKeys.affiliates.all()],
      [...queryKeys.affiliates.detail(id)],
    ],
  });
}

/**
 * Mutation hook to generate a unique affiliate code from the backend
 * Button-triggered, not auto-fetch. Returns { code: string }
 */
export function useGenerateAffiliateCode() {
  return useMutation({
    mutationFn: generateAffiliateCode,
  });
}
