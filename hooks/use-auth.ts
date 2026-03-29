import { useMutation } from "@tanstack/react-query";
import { useApp } from "@/lib/store";

export function useSendOtpMutation() {
  const { login } = useApp();

  return useMutation({
    mutationFn: async (email: string) => {
      await login(email);
    },
  });
}

export function useVerifyOtpMutation() {
  const { verifyOtp } = useApp();

  return useMutation({
    mutationFn: async (otp: string) => {
      await verifyOtp(otp);
    },
  });
}
