import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, ChevronDown, Leaf } from 'lucide-react'
import { Header } from './Header'
import { useUIStore } from '../../stores/uiStore'
import { checkAndApplyFreezes } from '../../hooks/useStreaks'
import { StreakDisplay } from '../gamification/StreakDisplay'
import { PointBadge } from '../gamification/PointBadge'
import { StreakCalendar } from '../gamification/StreakCalendar'
import { TransactionPopover } from '../gamification/TransactionPopover'

type PageKey = 'home' | 'tasks' | 'rewards' | 'mood' | 'data'

interface AppShellProps {
  children: ReactNode
  showToast: (message: string, type?: 'success' | 'error') => void
}

const subtitles: Record<PageKey, string> = {
  home: '愿你今天的每一步，都让自己更轻松一点。',
  tasks: '一件一件来，每完成一步都是进步。',
  rewards: '每一份努力，都在为你换取更好的生活。',
  mood: '记录每一次波动，也发现让你变好的规律。',
  data: '把完成、奖励和心情放在一起看见。',
}

const pathToPage: Record<string, PageKey> = {
  '/': 'home',
  '/tasks': 'tasks',
  '/rewards': 'rewards',
  '/mood': 'mood',
  '/data': 'data',
}

export function AppShell({ children, showToast }: AppShellProps) {
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen)
  const showStreakCalendar = useUIStore((s) => s.showStreakCalendar)
  const setShowStreakCalendar = useUIStore((s) => s.setShowStreakCalendar)
  const location = useLocation()
  const currentPage = pathToPage[location.pathname] ?? 'home'

  useEffect(() => {
    checkAndApplyFreezes(showToast)
  }, [showToast])

  return (
    <div className="app-canvas">
      <AnimatePresence>
        {showStreakCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
            onClick={() => setShowStreakCalendar(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <StreakCalendar onClose={() => setShowStreakCalendar(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="app-frame">
        <Header onSettingsClick={() => setSettingsOpen(true)} />
        <div className="app-workspace">
          <header className="topbar">
            <div>
              <p className="topbar-title">
                下午好，林小满 <Leaf size={18} strokeWidth={2} aria-hidden="true" />
              </p>
              <p className="topbar-subtitle">{subtitles[currentPage]}</p>
            </div>
            <div className="topbar-actions">
              {currentPage !== 'tasks' && (
                <div className="flex items-center gap-2">
                  <StreakDisplay onCalendarOpen={() => setShowStreakCalendar(true)} />
                  <div className="relative">
                    <PointBadge />
                    <TransactionPopover />
                  </div>
                </div>
              )}
              <button type="button" className="icon-button" aria-label="通知">
                <Bell size={21} />
                <span className="notify-dot" />
              </button>
              <div className="avatar-lockup">
                <div className="avatar">林</div>
                <span>林小满</span>
                <ChevronDown size={16} />
              </div>
            </div>
          </header>

          <main className="page-shell">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
