'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/store'
import { Layers, ArrowRight, CheckCircle2, Zap, Shield } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { email: 'admin@affiliateos.com', label: 'Admin', color: 'var(--primary-fixed)', textColor: 'var(--on-primary-fixed)' },
  { email: 'jordan@partner.com', label: 'Vendor (Jordan)', color: 'var(--secondary-container)', textColor: 'var(--on-secondary-container)' },
  { email: 'priya@creator.io', label: 'Vendor (Priya)', color: 'var(--tertiary-container)', textColor: 'var(--on-tertiary-container)' },
]

export default function LoginPage() {
  const { login } = useApp()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true)
    const ok = await login(email.trim())
    setLoading(false)
    if (ok) {
      router.push('/login/otp')
    } else {
      setError('No account found with that email. Try a demo account below.')
    }
  }

  function quickLogin(demoEmail: string) {
    setEmail(demoEmail)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface)' }}>
      {/* Left panel — branding */}
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
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
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

      {/* Right panel — form */}
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

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              Enter your email to receive a one-time passcode.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-150 outline-none"
                style={{
                  background: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  border: error ? '2px solid var(--error)' : '2px solid transparent',
                }}
                onFocus={e => { if (!error) e.currentTarget.style.border = '2px solid rgba(43,75,185,0.4)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}
                onBlur={e => { if (!error) e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.background = 'var(--surface-container-low)' }}
              />
              {error && (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--error)' }}>{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--on-surface-variant)' }}>
              Demo Accounts
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  onClick={() => quickLogin(acct.email)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:opacity-80 cursor-pointer"
                  style={{ background: 'var(--surface-container-low)' }}
                >
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                    style={{ background: acct.color, color: acct.textColor }}
                  >
                    {acct.label}
                  </span>
                  <span className="text-xs truncate" style={{ color: 'var(--on-surface-variant)' }}>{acct.email}</span>
                </button>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--on-surface-variant)' }}>
              Use any 6-digit code as OTP on the next step.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
