import { useQuery } from "@tanstack/react-query";

import {
  searchUsers,
  getUserDetail,
  createUser,
  updateUser,
} from "@/lib/api/users";
import type {
  SearchUsersParams,
  CreateUserPayload,
  CreateUserResponse,
} from "@/lib/api/users";

import { queryKeys, useApiMutation } from "./use-query";

export function useSearchUsers(
  search: string,
  page = 1,
  perPage = 10,
  roles?: string[],
) {
  return useQuery({
    queryKey: queryKeys.users.list({ search, page, perPage, roles }),
    queryFn: () =>
      searchUsers({ search, page, perPage, role: roles } as SearchUsersParams),
    // enabled: search.trim().length > 0,
    // Keep previous data while fetching new results for smooth UX
    placeholderData: (previousData) => previousData,
  });
}

export function useSearchVendors(search: string, page = 1, perPage = 10) {
  return useQuery({
    queryKey: queryKeys.users.list({
      search,
      page,
      perPage,
      context: "vendors",
    }),
    queryFn: () =>
      searchUsers({
        search,
        page,
        perPage,
        role: ["admin", "vendor"],
        extras: true,
        sortBy: "roles",
        sortOrder: "asc",
      }),
    placeholderData: (previousData) => previousData,
  });
}

export function useUserDetail(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId!),
    queryFn: () => getUserDetail(userId!),
    enabled: !!userId,
  });
}

/**
 * Mutation hook to create a new user
 * Invalidates users list on success
 */
export function useCreateUser() {
  return useApiMutation<CreateUserResponse, CreateUserPayload>({
    mutationFn: createUser,
    invalidateKeys: [[...queryKeys.users.all()]],
  });
}

/**
 * Mutation hook to update an existing user
 * Invalidates users list and detail on success
 */
export function useUpdateUser(userId: string) {
  return useApiMutation<CreateUserResponse, CreateUserPayload>({
    mutationFn: (payload) => updateUser(userId, payload),
    invalidateKeys: [
      [...queryKeys.users.all()],
      [...queryKeys.users.detail(userId)],
    ],
  });
}
