import { useQuery } from "@tanstack/react-query";

import { searchUsers } from "@/lib/api/users";
import type { SearchUsersParams } from "@/lib/api/users";

import { queryKeys } from "./use-query";

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
