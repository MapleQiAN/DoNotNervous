import { useState, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { api } from '../../lib/api'
import { LoginPage } from './LoginPage'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { accessToken, refreshToken, setTokens, logout } = useAuthStore()
  const [checking, setChecking] = useState(!!accessToken)

  useEffect(() => {
    if (!accessToken || !refreshToken) {
      setChecking(false)
      return
    }

    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken })
      .then((data) => {
        setTokens(data.accessToken, data.refreshToken)
      })
      .catch(() => {
        logout()
      })
      .finally(() => setChecking(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!accessToken) {
    return <LoginPage />
  }

  return <>{children}</>
}
