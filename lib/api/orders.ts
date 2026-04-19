import { apiClient } from "./client";
import type { Order } from "../types";
import type { OrderFormData } from "../order-form-store";

// ── Order Detail types ──────────────────────────────────────────────────────

export interface Address {
  id: string;
  userId: string;
  addressType: "shipping" | "billing";
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  isDefault: boolean;
  createdAt: string;
}
export interface OrderDetailProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  totalStock: number;
  status: string;
  updatedAt: string;
  createdAt: string;
}

export interface OrderDetailItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: OrderDetailProduct;
}

export interface OrderAddress extends Address {}

export interface OrderPayment {
  id: string;
  orderId: string;
  paymentMethod: string;
  provider: string;
  amount: number;
  currency: string;
  transactionId: string | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export interface OrderAffiliate {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  vendor: {
    name: string;
    email: string;
  };
}
export interface OrderVerification {
  id: string;
  orderId: string;
  verifiedBy: string | null;
  verificationStatus: string;
  customerResponse: string | null;
  remarks: string | null;
  verifiedAt: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface OrderStatusEntry {
  status: string;
  createdAt: string;
  createdBy: string | null;
}

export interface OrderDetailResponse {
  id: string;
  userId: string;
  orderNumber: string;
  status: string;
  affiliateId: string | null;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingAddressId: string;
  billingAddressId: string;
  paymentMethod: string;
  notes: string | null;
  updatedAt: string;
  createdAt: string;
  createdBy: string | null;
  items: OrderDetailItem[];
  user: { email: string; name: string };
  payment: OrderPayment | null;
  verification: OrderVerification | null;
  earnings: {
    id: string;
    orderId: string;
    affiliateId: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
  affiliate: OrderAffiliate | null;
  shippingAddress: OrderAddress | null;
  billingAddress: OrderAddress | null;
  statuses?: OrderStatusEntry[];
}

export interface OrderStatsResponse {
  totalOrders: number;
  processingOrders: number;
  grossRevenue: number;
  cancellations: number;
}

export interface OrderListItem {
  id: string;
  userId: string;
  orderNumber: string;
  status: string;
  affiliateId: string | null;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingAddressId: string;
  billingAddressId: string;
  paymentMethod: string;
  notes: string | null;
  additionalInfo: any;
  updatedAt: string;
  createdAt: string;
  createdBy: string | null;
  user: {
    email: string;
    name: string;
  };
  items: {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
      id: string;
      title: string;
    };
  }[];
  payment: {
    paymentMethod: string;
    amount: number;
    status: string;
    paidAt: string | null;
  };
}

export interface OrdersListResponse {
  items: OrderListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface FetchOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateOrderResponse {
  message: string;
  order: Order;
}

export type CreateOrderPayload = Omit<
  OrderFormData,
  "sameAsShipping" | "customerMode" | "productId" | "quantity"
> & {
  userId?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
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
    name: string;
    email: string;
  };
}

export interface VerifyOrderItem {
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock: number;
}

export interface VerifyOrderResponse {
  items: VerifyOrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  currency: string;
  affiliateCode?: string;
  affiliateDiscount?: {
    type: "PERCENTAGE" | "FIXED";
    value: number;
    amount: number;
  };
}

export async function createOrder(data: CreateOrderPayload): Promise<Order> {
  const { data: res } = await apiClient.post<CreateOrderResponse>(
    "/orders",
    data,
  );
  return res.order;
}

export async function verifyOrder(
  data: CreateOrderPayload,
): Promise<VerifyOrderResponse> {
  const { data: res } = await apiClient.post<VerifyOrderResponse>(
    "/orders/verify",
    data,
  );
  return res;
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

export async function fetchOrderDetails(
  id: string,
): Promise<OrderDetailResponse> {
  const { data } = await apiClient.get<OrderDetailResponse>(`/orders/${id}`);
  return data;
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<OrderDetailResponse> {
  const { data } = await apiClient.patch<OrderDetailResponse>(
    `/orders/${orderId}/status`,
    { status },
  );
  return data;
}

export async function fetchOrderStats(): Promise<OrderStatsResponse> {
  const { data } = await apiClient.get<OrderStatsResponse>("/orders/stats");
  return data;
}

export async function fetchOrders(
  params?: FetchOrdersParams,
): Promise<OrdersListResponse> {
  const { data } = await apiClient.get<OrdersListResponse>("/orders", {
    params,
  });
  return data;
}
