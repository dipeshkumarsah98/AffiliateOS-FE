// Shared form data store between /orders/new and /orders/new/review
// Uses sessionStorage so it survives client-side navigation but clears on tab close.

export interface AddressInput {
  street_address?: string;
  city: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface OrderFormData {
  // Customer Information
  customerEmail: string;
  customerName: string;
  customerPhone: string;

  // Addresses
  shippingAddressId?: string;
  shippingAddress: AddressInput;

  billingAddressId?: string;
  billingAddress: AddressInput;
  sameAsShipping: boolean;

  // Order Details
  items: OrderItemInput[];
  paymentMethod: "ESEWA" | "KHALTI" | "COD";
  affiliateCode?: string;
  notes?: string;

  // Meta
  editId?: string;
}

const KEY = "order_form_draft";

export function saveOrderFormDraft(data: OrderFormData) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  }
}

export function loadOrderFormDraft(): OrderFormData | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrderFormData;
  } catch {
    return null;
  }
}

export function clearOrderFormDraft() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(KEY);
  }
}
