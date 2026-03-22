'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { User } from './types'
import { DUMMY_USERS } from './dummy-data'

interface AppState {
  currentUser: User | null
  // Auth
  login: (email: string) => Promise<boolean>
  verifyOtp: (otp: string) => boolean
  logout: () => void
  // OTP state
  pendingEmail: string | null
  setPendingEmail: (email: string | null) => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const login = useCallback(async (email: string): Promise<boolean> => {
    const user = DUMMY_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (user) {
      setPendingEmail(email)
      return true
    }
    return false
  }, [])

  const verifyOtp = useCallback((otp: string): boolean => {
    if (otp.length === 6 && pendingEmail) {
      const user = DUMMY_USERS.find(u => u.email.toLowerCase() === pendingEmail.toLowerCase())
      if (user) {
        setCurrentUser(user)
        setPendingEmail(null)
        return true
      }
    }
    return false
  }, [pendingEmail])

  const logout = useCallback(() => {
    setCurrentUser(null)
    setPendingEmail(null)
  }, [])

  return (
    <AppContext.Provider value={{
      currentUser, login, verifyOtp, logout,
      pendingEmail, setPendingEmail,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
