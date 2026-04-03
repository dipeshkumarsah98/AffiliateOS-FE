"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiMutation, queryKeys } from "./use-query";
import {
  createOrder,
  fetchOrderDetails,
  updateOrderStatus,
  validateAffiliateCodeAPI,
  fetchOrders,
  fetchOrderStats,
} from "@/lib/api/orders";
import type {
  CreateOrderPayload,
  FetchOrdersParams,
  OrderDetailResponse,
} from "@/lib/api/orders";
import type { OrderFormData } from "@/lib/order-form-store";
import { clearOrderFormDraft } from "@/lib/order-form-store";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/types";

export function useOrdersQuery(params?: FetchOrdersParams) {
  return useQuery({
    queryKey: [...queryKeys.orders.list(params as Record<string, unknown>)],
    queryFn: () => fetchOrders(params),
  });
}

export function useOrderStatsQuery() {
  return useQuery({
    queryKey: [...queryKeys.orders.all(), "stats"],
    queryFn: () => fetchOrderStats(),
  });
}

export function useValidateAffiliateCode(code: string) {
  return useQuery({
    queryKey: ["validate-affiliate-code", code],
    queryFn: () => validateAffiliateCodeAPI(code),
    enabled: code.trim().length > 0,
    retry: false,
  });
}

export function useCreateOrder() {
  const router = useRouter();

  return useApiMutation<Order, OrderFormData>({
    mutationFn: async (data: OrderFormData) => {
      const payload: CreateOrderPayload = {
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        shippingAddress: data.shippingAddress,
        billingAddress: data.sameAsShipping
          ? data.shippingAddress
          : data.billingAddress,
        items: data.items,
        paymentMethod: data.paymentMethod,
        affiliateCode: data.affiliateCode || undefined,
        notes: data.notes || undefined,
        // Include user and address IDs if existing customer/addresses were selected
        userId: data.customerId,
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId,
        customerId: data.customerId,
      };

      return createOrder(payload);
    },
    invalidateKeys: [[...queryKeys.orders.all()]],
    onSuccess: (data) => {
      clearOrderFormDraft();
      toast.success("Order created successfully!");
      router.push("/dashboard/orders");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create order",
      );
    },
  });
}

export function useOrderDetailQuery(id: string) {
  return useQuery({
    queryKey: [...queryKeys.orders.detail(id)],
    queryFn: () => fetchOrderDetails(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  return useApiMutation<
    OrderDetailResponse,
    { orderId: string; status: string }
  >({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    invalidateKeys: [[...queryKeys.orders.all()]],
    onSuccess: () => {
      toast.success("Order status updated");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update status",
      );
    },
  });
}
