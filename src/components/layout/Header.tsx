import { Settings, Gift } from 'lucide-react'
import { PointBadge } from '../gamification/PointBadge'
import { TransactionPopover } from '../gamification/TransactionPopover'
import { StreakDisplay } from '../gamification/StreakDisplay'

interface HeaderProps {
  onSettingsClick: () => void
  currentPage: 'tasks' | 'rewards'
  setCurrentPage: (page: 'tasks' | 'rewards') => void
}

export function Header({ onSettingsClick, currentPage, setCurrentPage }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-cream-50/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <h1 className="text-xl font-semibold text-text-primary">DoNotNervous</h1>
        <div className="flex items-center gap-2">
          <StreakDisplay />
          <div className="relative">
            <PointBadge />
            <TransactionPopover />
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentPage(currentPage === 'rewards' ? 'tasks' : 'rewards')
            }}
            className={`text-text-secondary hover:bg-cream-100 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${currentPage === 'rewards' ? 'bg-sage-100 text-sage-600' : ''}`}
            aria-label="Reward Shop"
          >
            <Gift size={20} />
          </button>
          <button
            type="button"
            onClick={onSettingsClick}
            className="text-text-secondary hover:bg-cream-100 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
