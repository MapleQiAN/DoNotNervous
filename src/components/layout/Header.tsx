import { NavLink } from 'react-router-dom'
import { BarChart3, CheckSquare, Gift, Home, Leaf, Settings, Smile } from 'lucide-react'

interface HeaderProps {
  onSettingsClick: () => void
}

const navItems = [
  { path: '/' as const, label: '首页', ariaLabel: 'Home', Icon: Home },
  { path: '/tasks' as const, label: '任务清单', ariaLabel: 'Tasks', Icon: CheckSquare },
  { path: '/mood' as const, label: '心情记录', ariaLabel: 'Mood', Icon: Smile },
  { path: '/rewards' as const, label: '奖励金库', ariaLabel: 'Rewards', Icon: Gift },
  { path: '/data' as const, label: '数据复盘', ariaLabel: 'Data', Icon: BarChart3 },
]

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <>
      <aside className="hidden app-sidebar">
        {/* Brand Block */}
        <div className="brand-lockup">
          <div className="brand-mark">
            <Leaf size={26} />
          </div>
          <div>
            <p className="brand-name">DoNotNervous</p>
            <p className="brand-subtitle">慢下来，好好生活</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav" aria-label="主导航">
          {navItems.map(({ path, label, ariaLabel, Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              aria-label={ariaLabel}
              className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button type="button" onClick={onSettingsClick} className="sidebar-link">
            <Settings size={20} strokeWidth={1.8} />
            <span>设置</span>
          </button>
        </nav>

        {/* Sidebar Wellness Card */}
        <div className="sidebar-note">
          <p>照顾好自己，</p>
          <p>才有能量走更远的路。</p>
          <img className="plant-card" src="/illustrations/sidebar-plant.png" alt="" aria-hidden="true" />
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[640px] items-center justify-around px-2 pb-2 pt-1">
          {navItems.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex min-h-[52px] min-w-[52px] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-all ${
                  isActive ? 'text-sage-500' : 'text-text-secondary/60 hover:text-text-secondary'
                }`
              }
              aria-label={label}
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className={`text-[9px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {label.replace('任务清单', '任务').replace('奖励金库', '奖励').replace('心情记录', '心情').replace('数据复盘', '数据')}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
