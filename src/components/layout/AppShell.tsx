import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, ChevronDown } from 'lucide-react'
import { Header } from './Header'
import { useUIStore } from '../../stores/uiStore'
import { checkAndApplyFreezes } from '../../hooks/useStreaks'
import { RewardShop } from '../rewards/RewardShop'
import { MoodCalendar } from '../mood/MoodCalendar'
import { HomePage } from '../home/HomePage'
import { TaskInput } from '../tasks/TaskInput'

interface AppShellProps {
  children: ReactNode
  showToast: (message: string, type?: 'success' | 'error') => void
}

const subtitles: Record<string, string> = {
  home: '愿你今天的每一步，都让自己更轻松一点。',
  tasks: '愿你今天的每一步，都让自己更轻松一点。',
  rewards: '每一份努力，都在为你换取更好的生活。',
  mood: '记录每一次波动，也发现让你变好的规律。',
  data: '把完成、奖励和心情放在一起看见。',
}

export function AppShell({ children, showToast }: AppShellProps) {
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen)
  const currentPage = useUIStore((s) => s.currentPage)
  const setCurrentPage = useUIStore((s) => s.setCurrentPage)

  useEffect(() => {
    checkAndApplyFreezes(showToast)
  }, [showToast])

  return (
    <div className="app-canvas">
      <div className="app-frame">
        <Header
          onSettingsClick={() => setSettingsOpen(true)}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
        <div className="app-workspace">
          <header className="topbar">
            <div>
              <p className="topbar-title">下午好，林小满 <span aria-hidden="true">🌿</span></p>
              <p className="topbar-subtitle">{subtitles[currentPage]}</p>
            </div>
            <div className="topbar-actions">
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
                key={currentPage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {currentPage === 'home' && <HomePage showToast={showToast} />}
                {currentPage === 'tasks' && (
                  <div className="dashboard-grid task-route">
                    <section className="main-column">{children}</section>
                    <aside className="right-column">
                      <TaskInput />
                    </aside>
                  </div>
                )}
                {currentPage === 'rewards' && <RewardShop showToast={showToast} />}
                {(currentPage === 'mood' || currentPage === 'data') && (
                  <MoodCalendar showToast={showToast} activeView={currentPage} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
