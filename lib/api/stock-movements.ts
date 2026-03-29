import { apiClient } from "./client";

export type StockMovementType = "IN" | "OUT";
export type StockMovementReason =
  | "RESTOCK"
  | "ORDER_PLACED"
  | "ORDER_CANCELLED"
  | "RETURN"
  | "CORRECTION";

export interface StockMovementProduct {
  id: string;
  title: string;
  slug: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: StockMovementReason;
  orderId: string | null;
  userId: string;
  notes: string | null;
  createdAt: string;
  product: StockMovementProduct | null;
}

export interface CreateStockMovementPayload {
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: StockMovementReason;
  notes?: string;
}

export interface GetStockMovementsResponse {
  items: StockMovement[];
  total: number;
  success: boolean;
}

export async function getStockMovements(productId: string) {
  const response = await apiClient.get<GetStockMovementsResponse>(
    "/stock-movements",
    {
      params: {
        product_id: productId,
      },
    },
  );

  return response.data;
}

export async function createStockMovement(payload: CreateStockMovementPayload) {
  const response = await apiClient.post<StockMovement>(
    "/stock-movements",
    payload,
  );

  return response.data;
}
