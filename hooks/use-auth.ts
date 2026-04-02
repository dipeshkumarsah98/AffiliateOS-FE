import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";

export function useSendOtpMutation() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async (email: string) => {
      await login(email);
    },
  });
}

export function useVerifyOtpMutation() {
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  return useMutation({
    mutationFn: async (otp: string) => {
      await verifyOtp(otp);
    },
  });
}
