import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/lib/types";
import { sendOtpRequest, verifyOtpRequest } from "@/lib/api/auth";
import { setApiToken } from "@/lib/api/client";

const AUTH_TOKEN_STORAGE_KEY = "auth_token";
const AUTH_USER_STORAGE_KEY = "auth_user";

interface ApiAuthUser {
  id: string;
  email: string;
  phone?: string;
  address?: string;
  roles: string[];
  createdAt: string;
}

function mapApiRolesToUserRoles(roles: string[]): UserRole[] {
  const normalized = roles.map((role) => role.toLowerCase());
  if (normalized.includes("admin")) {
    return ["admin"];
  }
  return ["vendor"];
}

function buildDisplayName(email: string): string {
  const local = email.split("@")[0] ?? "User";
  const withSpaces = local.replace(/[._-]+/g, " ");
  return withSpaces
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function mapApiUserToUser(user: ApiAuthUser): User {
  return {
    id: user.id,
    email: user.email,
    roles: mapApiRolesToUserRoles(user.roles),
    name: buildDisplayName(user.email),
    phone: user.phone,
    address: user.address,
    createdAt: user.createdAt,
  };
}

interface AuthState {
  // Persisted state
  currentUser: User | null;
  authToken: string | null;
  pendingEmail: string | null;
  _hasHydrated: boolean;

  // Actions
  login: (email: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => void;
  setPendingEmail: (email: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      authToken: null,
      pendingEmail: null,
      _hasHydrated: false,

      // Actions
      login: async (email: string) => {
        await sendOtpRequest({ email });
        set({ pendingEmail: email });
      },

      verifyOtp: async (otp: string) => {
        const state = get();
        if (!state.pendingEmail) {
          throw new Error("No pending email found. Please request a new OTP.");
        }

        const response = await verifyOtpRequest({
          email: state.pendingEmail,
          code: otp,
        });
        const mappedUser = mapApiUserToUser(response.user);

        setApiToken(response.token);

        set({
          currentUser: mappedUser,
          authToken: response.token,
          pendingEmail: null,
        });
      },

      logout: () => {
        setApiToken(null);
        set({
          currentUser: null,
          authToken: null,
          pendingEmail: null,
        });
      },

      setPendingEmail: (email: string | null) => {
        set({ pendingEmail: email });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        authToken: state.authToken,
        pendingEmail: state.pendingEmail,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Mark hydration as complete
            state._hasHydrated = true;

            // Sync token with API client
            if (state.authToken) {
              setApiToken(state.authToken);
            }

            // Migration: Check for old localStorage keys
            if (typeof window !== "undefined") {
              const oldToken = window.localStorage.getItem(
                AUTH_TOKEN_STORAGE_KEY,
              );
              const oldUser = window.localStorage.getItem(
                AUTH_USER_STORAGE_KEY,
              );

              // If new store is empty but old keys exist, migrate them
              if (!state.authToken && oldToken) {
                state.authToken = oldToken;
                setApiToken(oldToken);

                if (oldUser) {
                  try {
                    const parsedUser = JSON.parse(oldUser) as User;
                    state.currentUser = parsedUser;
                  } catch {
                    // Invalid stored user, ignore
                  }
                }

                // Clean up old keys
                window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
                window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
              }
            }
          }
        };
      },
    },
  ),
);
