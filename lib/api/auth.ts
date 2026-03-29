import { apiClient } from "./client";

export interface SendOtpRequest {
  email: string;
}

export interface SendOtpResponse {
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface VerifyOtpResponse {
  token: string;
  user: {
    id: string;
    email: string;
    phone?: string;
    address?: string;
    roles: string[];
    createdAt: string;
  };
}

export async function sendOtpRequest(payload: SendOtpRequest) {
  const response = await apiClient.post<SendOtpResponse>(
    "/auth/send-otp",
    payload,
  );
  return response.data;
}

export async function verifyOtpRequest(payload: VerifyOtpRequest) {
  const response = await apiClient.post<VerifyOtpResponse>(
    "/auth/verify-otp",
    payload,
  );
  return response.data;
}
