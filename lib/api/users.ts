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

// ── User Extras types ───────────────────────────────────────────────────────

export interface UserExtras {
  bankName?: string;
  accountNumber?: string;
  affiliateType?: string;
}

// ── User Search types ───────────────────────────────────────────────────────

export interface UserSearchItem {
  id: string;
  email: string;
  name: string;
  phone: string;
  roles: string[];
  createdAt: string;
  extras?: UserExtras;
  addresses: UserAddress[];
}

export interface SearchUsersParams {
  search: string;
  page?: number;
  perPage?: number;
  role?: string[];
  extras?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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
    paramsSerializer: (params) => {
      const searchParams = new URLSearchParams();
      Object.entries(params as Record<string, unknown>).forEach(
        ([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, String(v)));
          } else if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        },
      );
      return searchParams.toString();
    },
  });
  return data;
}
