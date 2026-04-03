import { apiClient } from "./client";
import type { Order } from "../types";
import type { OrderFormData } from "../order-form-store";

export interface CreateOrderResponse {
  message: string;
  order: Order;
}

export type CreateOrderPayload = Omit<OrderFormData, "sameAsShipping"> & {
  billingAddress: OrderFormData["sameAsShipping"] extends true
    ? OrderFormData["shippingAddress"]
    : OrderFormData["billingAddress"];
};

export interface ValidateAffiliateCodeResponse {
  code: string;
  isActive: boolean;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  product: {
    id: string;
    title: string;
  };
  vendor: {
    id: string;
    email: string;
  };
}

export async function createOrder(data: CreateOrderPayload): Promise<Order> {
  const { data: res } = await apiClient.post<CreateOrderResponse>(
    "/orders",
    data,
  );
  return res.order;
}

export async function validateAffiliateCodeAPI(
  code: string,
): Promise<ValidateAffiliateCodeResponse> {
  // Use existing affiliates backend route or specific order validate endpoint.
  // Here assuming /affiliates/validate/{code} or similar.
  const { data: res } = await apiClient.get<ValidateAffiliateCodeResponse>(
    `/affiliates/validate/${code}`,
  );
  return res;
}

export async function fetchOrderDetails(id: string): Promise<Order> {
  const { data: res } = await apiClient.get<{ order: Order }>(`/orders/${id}`);
  return res.order;
}
