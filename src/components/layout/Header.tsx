import { BarChart3, CheckSquare, Gift, Home, Leaf, Settings, Smile } from 'lucide-react'

type PageKey = 'home' | 'tasks' | 'rewards' | 'mood' | 'data'

interface HeaderProps {
  onSettingsClick: () => void
  currentPage: PageKey
  setCurrentPage: (page: PageKey) => void
}

const navItems = [
  { key: 'home' as const, label: '首页', ariaLabel: 'Home', Icon: Home },
  { key: 'tasks' as const, label: '任务清单', ariaLabel: 'Tasks', Icon: CheckSquare },
  { key: 'mood' as const, label: '心情记录', ariaLabel: 'Mood', Icon: Smile },
  { key: 'rewards' as const, label: '奖励金库', ariaLabel: 'Rewards', Icon: Gift },
  { key: 'data' as const, label: '数据复盘', ariaLabel: 'Data', Icon: BarChart3 },
]

export function Header({ onSettingsClick, currentPage, setCurrentPage }: HeaderProps) {
  return (
    <>
      <aside className="hidden lg:flex app-sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Leaf size={30} />
          </div>
          <div>
            <p className="brand-name">DoNotNervous</p>
            <p className="brand-subtitle">慢下来，好好生活</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="主导航">
          {navItems.map(({ key, label, ariaLabel, Icon }) => {
            const active = currentPage === key
            return (
              <button
                key={key}
                type="button"
                aria-label={ariaLabel}
                onClick={() => setCurrentPage(key)}
                className={`sidebar-link ${active ? 'is-active' : ''}`}
              >
                <Icon size={22} strokeWidth={active ? 2.6 : 1.9} />
                <span>{label}</span>
              </button>
            )
          })}
          <button type="button" onClick={onSettingsClick} className="sidebar-link">
            <Settings size={22} strokeWidth={1.9} />
            <span>设置</span>
          </button>
        </nav>

        <div className="sidebar-note">
          <p>照顾好自己，</p>
          <p>才有能量走更远的路。</p>
          <img className="plant-card" src="/illustrations/sidebar-plant.png" alt="" aria-hidden="true" />
          <button type="button" className="daily-chip">今日小贴士</button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[640px] items-center justify-around px-2 pb-2 pt-1">
          {navItems.slice(0, 4).map(({ key, label, Icon }) => {
            const active = currentPage === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCurrentPage(key)}
                className={`flex min-h-[52px] min-w-[64px] flex-col items-center gap-0.5 rounded-2xl px-4 py-1.5 transition-all ${
                  active ? 'text-sage-500' : 'text-text-secondary/60 hover:text-text-secondary'
                }`}
                aria-label={label}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                  {label.replace('任务清单', '任务').replace('奖励金库', '奖励').replace('心情记录', '心情')}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
