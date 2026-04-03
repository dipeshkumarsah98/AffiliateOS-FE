import { apiClient } from "./client";

// ── User Address types ──────────────────────────────────────────────────────

export interface UserAddress {
  id: string;
  addressType: "shipping" | "billing";
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  isDefault: boolean;
}

// ── User Search types ───────────────────────────────────────────────────────

export interface UserSearchItem {
  id: string;
  email: string;
  name: string;
  phone: string;
  roles: string[];
  createdAt: string;
  addresses: UserAddress[];
}

export interface SearchUsersParams {
  search: string;
  page?: number;
  perPage?: number;
}

export interface SearchUsersResponse {
  items: UserSearchItem[];
  total: number;
  page: number;
  perPage: number;
  search: string;
}

// ── API Functions ───────────────────────────────────────────────────────────

export async function searchUsers(
  params: SearchUsersParams,
): Promise<SearchUsersResponse> {
  const { data } = await apiClient.get<SearchUsersResponse>("/users", {
    params,
  });
  return data;
}
