'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/store'
import { useSendOtpMutation, useVerifyOtpMutation } from '@/hooks/use-auth'
import { getApiErrorMessage } from '@/lib/api/client'
import { Layers, ArrowRight, RefreshCw, ChevronLeft, CheckCircle2, Zap, Shield } from 'lucide-react'
import Link from 'next/link'

export default function OtpPage() {
  const { pendingEmail } = useApp()
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(30)
  const verifyOtpMutation = useVerifyOtpMutation()
  const resendOtpMutation = useSendOtpMutation()
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const hasRedirected = useRef(false)
  useEffect(() => {
    if (!pendingEmail && !hasRedirected.current) router.replace('/login')
  }, [pendingEmail, router])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  const handleChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = digit
    setOtp(next)
    setError('')
    if (digit && idx < 5) inputs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]
    text.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    inputs.current[Math.min(text.length, 5)]?.focus()
  }

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter all 6 digits.'); return }

    try {
      await verifyOtpMutation.mutateAsync(code)
      hasRedirected.current = true
      router.push('/dashboard')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid OTP. Please try again.'))
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    }
  }, [otp, verifyOtpMutation, router])

  const handleResend = async () => {
    if (countdown > 0 || !pendingEmail) return

    try {
      await resendOtpMutation.mutateAsync(pendingEmail)
      setCountdown(30)
      setOtp(['', '', '', '', '', ''])
      setError('')
      inputs.current[0]?.focus()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to resend OTP. Please try again.'))
    }
  }

  if (!pendingEmail) return null

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface)' }}>
      {/* Left panel — branding (identical to login page) */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1a3299 0%, #2b4bb9 40%, #4865d3 100%)' }}
      >
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)',
        }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            AffiliateOS
          </span>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
              Track every order.<br />
              <span className="text-blue-200">Earn every commission.</span>
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
              The affiliate e-commerce intelligence platform built for vendors who demand precision.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: Zap, text: 'Real-time order tracking & status updates' },
              { icon: Shield, text: 'Role-based access for admins & vendors' },
              { icon: CheckCircle2, text: 'Affiliate link management & commissions' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <f.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-blue-100 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex gap-8">
          {[
            { value: '12.4K', label: 'Orders Tracked' },
            { value: '$840K', label: 'Revenue Processed' },
            { value: '98.2%', label: 'Uptime SLA' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{s.value}</p>
              <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — OTP form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
            >
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)' }}>AffiliateOS</span>
          </div>

          {/* Back link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to login
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              Check your email
            </h1>
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              We sent a 6-digit code to{' '}
              <span className="font-semibold" style={{ color: 'var(--on-surface)' }}>{pendingEmail}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* OTP digit inputs */}
            <div>
              <label className="block text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--on-surface-variant)' }}>
                One-Time Passcode
              </label>
              <div className="flex w-full gap-2" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="flex-1 min-w-0 text-center text-xl font-bold rounded-lg transition-all duration-150 outline-none"
                    style={{
                      height: '52px',
                      background: digit ? 'var(--primary-fixed)' : 'var(--surface-container-low)',
                      color: digit ? 'var(--on-primary-fixed)' : 'var(--on-surface)',
                      border: error ? '2px solid var(--error)' : digit ? '2px solid var(--primary)' : '2px solid transparent',
                    }}
                    onFocus={e => {
                      if (!error) e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)'
                      e.currentTarget.style.background = 'var(--surface-container-lowest)'
                    }}
                    onBlur={e => {
                      if (!e.currentTarget.value) {
                        e.currentTarget.style.background = 'var(--surface-container-low)'
                        if (!error) e.currentTarget.style.border = '2px solid transparent'
                      }
                    }}
                  />
                ))}
              </div>
              {error && (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--error)' }}>{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={verifyOtpMutation.isPending || otp.join('').length < 6}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
            >
              {verifyOtpMutation.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Verify & Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6">
            <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              {"Didn't receive the code?"}
            </p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resendOtpMutation.isPending}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium transition-opacity disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              style={{ color: countdown > 0 ? 'var(--on-surface-variant)' : 'var(--primary)' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendOtpMutation.isPending ? 'animate-spin' : ''}`} />
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
            </button>
            <p className="text-xs mt-4" style={{ color: 'var(--on-surface-variant)' }}>
              Enter the 6-digit code sent to your email.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
