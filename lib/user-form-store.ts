export interface AddressInput {
  addressType: "shipping" | "billing";
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  isDefault: boolean;
}

export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  roles: string[];
  isActive: boolean;
  addresses?: AddressInput[];
  editId?: string;
}

const KEY = "user_form_draft";

export function saveUserFormDraft(data: UserFormData) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  }
}

export function loadUserFormDraft(): UserFormData | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserFormData;
  } catch {
    return null;
  }
}

export function clearUserFormDraft() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(KEY);
  }
}
