import type { ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
}

// TEMP: Skip auth — bypass login for development
export function AuthGuard({ children }: AuthGuardProps) {
  return <>{children}</>
}
