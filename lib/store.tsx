'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { User, UserRole } from './types'
import { sendOtpRequest, verifyOtpRequest } from './api/auth'
import { setApiToken } from './api/client'

const AUTH_TOKEN_STORAGE_KEY = 'auth_token'
const AUTH_USER_STORAGE_KEY = 'auth_user'

interface ApiAuthUser {
  id: string
  email: string
  phone?: string
  address?: string
  roles: string[]
  createdAt: string
}

function mapApiRolesToUserRoles(roles: string[]): UserRole[] {
  const normalized = roles.map((role) => role.toLowerCase())
  if (normalized.includes('admin')) {
    return ['admin']
  }
  return ['vendor']
}

function buildDisplayName(email: string): string {
  const local = email.split('@')[0] ?? 'User'
  const withSpaces = local.replace(/[._-]+/g, ' ')
  return withSpaces
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function mapApiUserToUser(user: ApiAuthUser): User {
  return {
    id: user.id,
    email: user.email,
    roles: mapApiRolesToUserRoles(user.roles),
    name: buildDisplayName(user.email),
    phone: user.phone,
    address: user.address,
    createdAt: user.createdAt,
  }
}

interface AppState {
  currentUser: User | null
  authToken: string | null
  // Auth
  login: (email: string) => Promise<void>
  verifyOtp: (otp: string) => Promise<void>
  logout: () => void
  // OTP state
  pendingEmail: string | null
  setPendingEmail: (email: string | null) => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    const storedUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY)

    if (storedToken) {
      setAuthToken(storedToken)
      setApiToken(storedToken)
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User
        setCurrentUser(parsedUser)
      } catch {
        window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
      }
    }
  }, [])

  const login = useCallback(async (email: string): Promise<void> => {
    await sendOtpRequest({ email })
    setPendingEmail(email)
  }, [])

  const verifyOtp = useCallback(async (otp: string): Promise<void> => {
    if (!pendingEmail) {
      throw new Error('No pending email found. Please request a new OTP.')
    }

    const response = await verifyOtpRequest({ email: pendingEmail, code: otp })
    const mappedUser = mapApiUserToUser(response.user)

    setCurrentUser(mappedUser)
    setAuthToken(response.token)
    setPendingEmail(null)
    setApiToken(response.token)

    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, response.token)
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(mappedUser))
  }, [pendingEmail])

  const logout = useCallback(() => {
    setCurrentUser(null)
    setAuthToken(null)
    setPendingEmail(null)

    setApiToken(null)
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
  }, [])

  return (
    <AppContext.Provider value={{
      currentUser, authToken, login, verifyOtp, logout,
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
