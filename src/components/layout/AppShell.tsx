import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Header } from './Header'
import { useUIStore } from '../../stores/uiStore'
import { checkAndApplyFreezes } from '../../hooks/useStreaks'
import { RewardShop } from '../rewards/RewardShop'

interface AppShellProps {
  children: ReactNode
  showToast: (message: string, type?: 'success' | 'error') => void
}

export function AppShell({ children, showToast }: AppShellProps) {
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen)
  const currentPage = useUIStore((s) => s.currentPage)
  const setCurrentPage = useUIStore((s) => s.setCurrentPage)

  useEffect(() => {
    checkAndApplyFreezes(showToast)
  }, [showToast])

  return (
    <div className="min-h-screen bg-cream-50">
      <Header onSettingsClick={() => setSettingsOpen(true)} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="max-w-[640px] mx-auto px-4 py-6 lg:px-6 lg:py-8">
        {currentPage === 'tasks' ? children : <RewardShop showToast={showToast} />}
      </main>
    </div>
  )
}
