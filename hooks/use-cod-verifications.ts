"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiMutation, queryKeys } from "./use-query";
import {
  fetchCodVerifications,
  fetchCodVerificationStats,
  submitCodVerification,
} from "@/lib/api/cod-verifications";
import type {
  FetchCodVerificationsParams,
  SubmitCodVerificationPayload,
} from "@/lib/api/cod-verifications";

export function useCodVerificationsQuery(params?: FetchCodVerificationsParams) {
  return useQuery({
    queryKey: queryKeys.codVerifications.list(
      params as Record<string, unknown>,
    ),
    queryFn: () => fetchCodVerifications(params),
  });
}

export function useCodVerificationStatsQuery() {
  return useQuery({
    queryKey: [...queryKeys.codVerifications.all(), "stats"],
    queryFn: () => fetchCodVerificationStats(),
  });
}

export function useSubmitCodVerification(id: string) {
  return useApiMutation<void, SubmitCodVerificationPayload>({
    mutationFn: submitCodVerification,
    invalidateKeys: [
      queryKeys.codVerifications.all(),
      queryKeys.orders.all(),
      queryKeys.orders.detail(id),
    ],
    onSuccess: () => {
      toast.success("Verification submitted successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to submit verification",
      );
    },
  });
}
