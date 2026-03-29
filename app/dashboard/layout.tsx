'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/store'
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login')
    }
  }, [currentUser, router])

  if (!currentUser) return null

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface)' }}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 lg:ml-60 flex flex-col min-h-screen min-w-0">
        <div
          className="lg:hidden fixed top-3.5 left-4 z-30"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(19,27,46,0.1)' }}
            aria-label="Open menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="1.5" rx="0.75" fill="#374151" />
              <rect x="1" y="7.25" width="10" height="1.5" rx="0.75" fill="#374151" />
              <rect x="1" y="11.5" width="14" height="1.5" rx="0.75" fill="#374151" />
            </svg>
          </button>
        </div>
        {children}
      </main>
    </div>
  )
}
