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

export interface UserDetailAddress extends UserAddress {
  userId: string;
  createdAt: string;
}

export interface UserDetailResponse {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  roles: string[];
  createdAt: string;
  lastLogin?: string;
  addresses: UserDetailAddress[];
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

// ── Create User types ───────────────────────────────────────────────────────

export interface CreateUserAddress {
  addressType: "shipping" | "billing";
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  isDefault: boolean;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone?: string;
  roles: string[];
  isActive: boolean;
  addresses?: CreateUserAddress[];
}

export interface CreateUserResponse {
  id: string;
  email: string;
  name: string;
  phone?: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
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

export async function getUserDetail(
  userId: string,
): Promise<UserDetailResponse> {
  const { data } = await apiClient.get<UserDetailResponse>(`/users/${userId}`);
  return data;
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<CreateUserResponse> {
  const { data } = await apiClient.post<CreateUserResponse>("/users", payload);
  return data;
}

export async function updateUser(
  userId: string,
  payload: CreateUserPayload,
): Promise<CreateUserResponse> {
  const { data } = await apiClient.put<CreateUserResponse>(
    `/users/${userId}`,
    payload,
  );
  return data;
}
