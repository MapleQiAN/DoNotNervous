import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setUser: (user: AuthUser, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

const STORED_TOKENS_KEY = 'dnn_auth_tokens'

function loadStoredTokens(): { accessToken: string; refreshToken: string } | null {
  try {
    const stored = localStorage.getItem(STORED_TOKENS_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return null
}

function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(STORED_TOKENS_KEY, JSON.stringify({ accessToken, refreshToken }))
}

function clearStoredTokens() {
  localStorage.removeItem(STORED_TOKENS_KEY)
}

export const useAuthStore = create<AuthState>()((set) => {
  const stored = loadStoredTokens()
  return {
    user: null,
    accessToken: stored?.accessToken ?? null,
    refreshToken: stored?.refreshToken ?? null,
    isAuthenticated: false,
    setUser: (user, accessToken, refreshToken) => {
      storeTokens(accessToken, refreshToken)
      set({ user, accessToken, refreshToken, isAuthenticated: true })
    },
    setTokens: (accessToken, refreshToken) => {
      storeTokens(accessToken, refreshToken)
      set({ accessToken, refreshToken })
    },
    logout: () => {
      clearStoredTokens()
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
    },
  }
})
