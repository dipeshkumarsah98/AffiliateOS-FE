// Shared form data store between /affiliates/new and /affiliates/new/review
// Uses sessionStorage so it survives client-side navigation but clears on tab close.

// Minimal vendor info stored in draft for reconstructing selected card without API call
export interface DraftVendorInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
}

export interface AffiliateFormData {
  // Vendor selection mode
  vendorMode: "existing" | "new";
  vendorId?: string;
  draftVendorInfo?: DraftVendorInfo;
  // Personal
  fullName: string;
  email: string;
  affiliateType: "influencer" | "reseller" | "referral" | "partner";
  contactNumber: string;
  // Address (structured)
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  // Affiliate
  selectedProductId: string;
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
    const parsed = JSON.parse(raw);
    // Migration: old drafts with physicalAddress → structured address fields
    if (
      parsed.physicalAddress !== undefined &&
      parsed.streetAddress === undefined
    ) {
      parsed.streetAddress = parsed.physicalAddress;
      parsed.city = "";
      parsed.state = "";
      parsed.postalCode = "";
      delete parsed.physicalAddress;
    }
    // Default vendorMode for old drafts
    if (!parsed.vendorMode) {
      parsed.vendorMode = "new";
    }
    return parsed as AffiliateFormData;
  } catch {
    return null;
  }
}

export function clearFormDraft() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(KEY);
  }
}
