import { apiClient } from "./client";

export interface ProductListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  totalStock: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetProductsParams {
  page: number;
  limit: number;
  search?: string;
}

export interface GetProductsResponse {
  total: number;
  page: number;
  limit: number;
  items: ProductListItem[];
}

export async function getProducts(params: GetProductsParams) {
  const response = await apiClient.get<GetProductsResponse>("/products", {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.search ? { search: params.search } : {}),
    },
  });

  return response.data;
}
