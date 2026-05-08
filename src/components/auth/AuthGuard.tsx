import type { ReactNode } from 'react'
import { LoginPage } from './LoginPage'
import { useAuthStore } from '../../stores/authStore'
import { useInitAuth } from '../../hooks/useAuth'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const { loading } = useInitAuth()

  if (!accessToken) {
    return <LoginPage />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="animate-pulse text-[var(--color-text-secondary)]">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
