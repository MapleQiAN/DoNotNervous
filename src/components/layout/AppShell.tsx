import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Header } from './Header'
import { useUIStore } from '../../stores/uiStore'
import { checkAndApplyFreezes } from '../../hooks/useStreaks'

interface AppShellProps {
  children: ReactNode
  showToast: (message: string, type?: 'success' | 'error') => void
}

export function AppShell({ children, showToast }: AppShellProps) {
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen)

  useEffect(() => {
    checkAndApplyFreezes(showToast)
  }, [showToast])

  return (
    <div className="min-h-screen bg-cream-50">
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      <main className="max-w-[640px] mx-auto px-4 py-6 lg:px-6 lg:py-8">
        {children}
      </main>
    </div>
  )
}
