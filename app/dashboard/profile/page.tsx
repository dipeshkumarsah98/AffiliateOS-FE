'use client'

import { useAuthStore } from '@/stores/auth-store'
import { Topbar } from '@/components/layout/Topbar'
import { LogOut, Mail, ShieldCheck, User, CalendarDays, Layers } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  if (!currentUser) return null

  const initials = currentUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const isAdmin = currentUser.roles.includes('admin')
  const roleLabel = isAdmin ? 'Chief Administrator' : 'Affiliate Partner'

  const info = [
    { icon: User, label: 'Full Name', value: currentUser.name },
    { icon: Mail, label: 'Email Address', value: currentUser.email },
    { icon: ShieldCheck, label: 'Role', value: roleLabel },
    { icon: CalendarDays, label: 'Member Since', value: 'January 2024' },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f8faff' }}>
      <Topbar title="Profile" description="Manage your account information" />

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-xl mx-auto space-y-4">

          {/* Avatar + name card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 2px 16px rgba(19,27,46,0.06)' }}
          >
            {/* Gradient banner */}
            <div
              className="h-24"
              style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 60%, #6a84e8 100%)' }}
            />

            {/* Avatar row */}
            <div className="px-7 pb-7">
              <div className="flex items-end gap-4 -mt-9 mb-5">
                <div
                  className="w-18 h-18 rounded-2xl flex items-center justify-center text-xl font-bold border-4 flex-shrink-0"
                  style={{
                    width: '72px',
                    height: '72px',
                    background: 'linear-gradient(135deg, #1e3a9f 0%, #3d56c4 100%)',
                    color: '#fff',
                    borderColor: '#fff',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {initials}
                </div>
              </div>

              <h1
                className="text-2xl font-bold"
                style={{ color: '#0f172a', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
              >
                {currentUser.name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{roleLabel}</p>
            </div>
          </div>

          {/* Info fields */}
          <div
            className="rounded-2xl divide-y"
            style={{ background: '#fff', boxShadow: '0 2px 16px rgba(19,27,46,0.06)', divideColor: '#f4f5ff' }}
          >
            {info.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-7 py-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#eef2ff' }}
                >
                  <Icon className="w-4 h-4" style={{ color: '#2b4bb9' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>{label}</p>
                  <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: '#0f172a' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* App info */}
          <div
            className="rounded-2xl px-7 py-4 flex items-center gap-3"
            style={{ background: '#fff', boxShadow: '0 2px 16px rgba(19,27,46,0.06)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)' }}
            >
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>AffiliateOS</p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>v1.0.0 — Order Tracking System</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: '#fff1f2', color: '#be123c' }}
          >
            <LogOut className="w-4 h-4" />
            Sign out of AffiliateOS
          </button>

        </div>
      </main>
    </div>
  )
}
