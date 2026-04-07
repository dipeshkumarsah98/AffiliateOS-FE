'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, LogOut, User } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'

interface TopbarProps {
  title: string
  description?: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Chief Administrator',
  vendor: 'Affiliate Partner',
}

export function Topbar({ title, description }: TopbarProps) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const roles = currentUser?.roles ?? []
  const primaryRole = roles[0] ?? 'user'
  const roleLabel = ROLE_LABELS[primaryRole] ?? primaryRole

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await logout()
    router.push('/login')
  }

  function handleProfile() {
    setOpen(false)
    router.push('/dashboard/profile')
  }

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between pl-4 pr-4 lg:px-8 py-4"
      style={{
        background: 'var(--surface-container-lowest)',
        borderBottom: '1px solid rgba(195,197,220,0.25)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Page title — push right on mobile to clear the hamburger button */}
      <div className="pl-10 lg:pl-0">
        <h1
          className="text-lg lg:text-xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--on-surface-variant)' }}>
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center relative transition-colors hover:bg-[var(--surface-container-high)]"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: 'var(--primary)' }}
          />
        </button>

        {/* Profile widget + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-xl transition-colors hover:bg-[var(--surface-container-high)]"
          >
            {/* Name + role — hidden on small screens */}
            <div className="text-right hidden sm:block">
              <p
                className="text-sm font-bold leading-tight"
                style={{ color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
              >
                {currentUser?.name ?? 'User'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
                {roleLabel}
              </p>
            </div>

            {/* Avatar circle */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ring-2 ring-offset-2"
              style={{
                background: 'linear-gradient(135deg, #2b4bb9 0%, #4865d3 100%)',
                color: 'white',
                ringColor: 'rgba(43,75,185,0.25)',
              }}
            >
              {currentUser?.name?.charAt(0) ?? 'U'}
            </div>
          </button>

          {/* Dropdown */}
          {open && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-50 animate-fade-in-up"
              style={{
                background: 'var(--surface-container-lowest)',
                boxShadow: '0 12px 40px rgba(19,27,46,0.12)',
                border: '1px solid rgba(195,197,220,0.25)',
              }}
            >
              {/* User info header inside dropdown */}
              <div
                className="px-4 py-3"
                style={{ borderBottom: '1px solid rgba(195,197,220,0.2)', background: 'var(--surface-container-low)' }}
              >
                <p className="text-xs font-bold truncate" style={{ color: 'var(--on-surface)' }}>
                  {currentUser?.name}
                </p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--on-surface-variant)' }}>
                  {currentUser?.email}
                </p>
              </div>

              {/* Options */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={handleProfile}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--surface-container-high)] text-left"
                  style={{ color: 'var(--on-surface)' }}
                >
                  <User className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--on-surface-variant)' }} />
                  View Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-50 text-left"
                  style={{ color: '#dc2626' }}
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
