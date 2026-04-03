// Shared form data store between /affiliates/new and /affiliates/new/review
// Uses sessionStorage so it survives client-side navigation but clears on tab close.

export interface AffiliateFormData {
  // Personal
  fullName: string;
  email: string;
  affiliateType: "influencer" | "reseller" | "referral" | "partner";
  contactNumber: string;
  physicalAddress: string;
  // Affiliate
  selectedProductId: string; // Changed from array to single string
  affiliateCode: string;
  discountType: "fixed" | "percentage";
  discountValue: string;
  commissionType: "fixed" | "percentage";
  commissionValue: string;
  // Bank
  bankName: string;
  accountNumber: string;
  // Meta (for edit mode)
  editId?: string;
}

const KEY = "affiliate_form_draft";

export function saveFormDraft(data: AffiliateFormData) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  }
}

export function loadFormDraft(): AffiliateFormData | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AffiliateFormData;
  } catch {
    return null;
  }
}

export function clearFormDraft() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(KEY);
  }
}
