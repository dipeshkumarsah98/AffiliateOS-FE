import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn("NEXT_PUBLIC_API_URL is not configured. API requests may fail.");
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setApiToken(token: string | null): Promise<void> {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }

  // Sync token to an httpOnly cookie via the session API route
  // so the Next.js proxy can read it server-side
  if (typeof window !== "undefined") {
    return syncSessionCookie(token);
  }

  return Promise.resolve();
}

async function syncSessionCookie(token: string | null): Promise<void> {
  const url = "/api/auth/session";

  try {
    if (token) {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } else {
      await fetch(url, { method: "DELETE" });
    }
  } catch {
    // Non-critical: proxy redirect won't work but app still functions
  }
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().authToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getApiErrorMessage(
  error: unknown,
  fallback = "Request failed. Please try again.",
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; message?: string }
      | undefined;
    return data?.error ?? data?.message ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
