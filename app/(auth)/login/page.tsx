"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSendOtpMutation } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { ArrowRight, CheckCircle2, Zap, Shield } from "lucide-react";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const sendOtpMutation = useSendOtpMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      await sendOtpMutation.mutateAsync(email.trim());
      router.push("/login/otp");
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to send OTP. Please check your email and try again.",
        ),
      );
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--surface)" }}>
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, #9a0832 0%, #D60B47 40%, #e63468 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)",
          }}
        />

        <div className="relative flex items-center z-10">
          <div className="relative w-32 h-32 rounded-2xl bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 shadow-lg">
            <div className="relative w-full h-full">
              <Image
                src="/logo.png"
                alt="Khatriin Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2
              className="text-5xl font-bold text-white leading-tight mb-4"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.03em",
              }}
            >
              Track every order.
              <br />
              <span className="text-pink-200">Earn every commission.</span>
            </h2>
            <p className="text-pink-100 text-lg leading-relaxed max-w-sm">
              The affiliate e-commerce intelligence platform built for vendors
              who demand precision.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Zap, text: "Real-time order tracking & status updates" },
              { icon: Shield, text: "Role-based access for admins & vendors" },
              {
                icon: CheckCircle2,
                text: "Affiliate link management & commissions",
              },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <f.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-pink-100 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex gap-8">
          {[
            { value: "12.4K", label: "Orders Tracked" },
            { value: "$840K", label: "Revenue Processed" },
            { value: "98.2%", label: "Uptime SLA" },
          ].map((s) => (
            <div key={s.label}>
              <p
                className="text-2xl font-bold text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </p>
              <p className="text-xs text-pink-200 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="relative w-36 h-24 rounded-xl bg-white shadow-md flex items-center justify-center p-3">
              <div className="relative w-full h-full">
                <Image
                  src="/logo.png"
                  alt="Khatriin Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--on-surface)",
                letterSpacing: "-0.02em",
              }}
            >
              Welcome back
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Enter your email to receive a one-time passcode.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-150 outline-none"
                style={{
                  background: "var(--surface-container-low)",
                  color: "var(--on-surface)",
                  border: error
                    ? "2px solid var(--error)"
                    : "2px solid transparent",
                }}
                onFocus={(e) => {
                  if (!error)
                    e.currentTarget.style.border =
                      "2px solid rgba(214,11,71,0.4)";
                  e.currentTarget.style.background =
                    "var(--surface-container-lowest)";
                }}
                onBlur={(e) => {
                  if (!error)
                    e.currentTarget.style.border = "2px solid transparent";
                  e.currentTarget.style.background =
                    "var(--surface-container-low)";
                }}
              />
              {error && (
                <p className="mt-1.5 text-xs" style={{ color: "var(--error)" }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={sendOtpMutation.isPending}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #D60B47 0%, #e63468 100%)",
              }}
            >
              {sendOtpMutation.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
