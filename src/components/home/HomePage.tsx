import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Circle, Flame, Gift, PlusCircle, Smile, Wallet } from 'lucide-react'
import { db } from '../../db'
import { usePointBalance } from '../../hooks/usePoints'
import { useCurrentStreak } from '../../hooks/useStreaks'
import { useUIStore } from '../../stores/uiStore'
import type { Task } from '../../domain/types'

interface HomePageProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const difficultyLabels: Record<string, string> = {
  hard: '困难',
  medium: '中等',
  easy: '简单',
}

const priorityClass: Record<string, string> = {
  hard: 'tone-danger',
  medium: 'tone-blue',
  easy: 'tone-green',
}

function formatReward(task: Task) {
  if (task.difficulty === 'hard') return '+ ¥35'
  if (task.difficulty === 'medium') return '+ ¥20'
  return '+ ¥10'
}

export function HomePage({ showToast: _showToast }: HomePageProps) {
  void _showToast
  const balance = usePointBalance()
  const streakLength = useCurrentStreak()
  const setCurrentPage = useUIStore((s) => s.setCurrentPage)

  const activeTasks = useLiveQuery(
    () => db.tasks.where('status').equals('active').sortBy('sortOrder'),
    [],
    []
  )

  const completedToday = useLiveQuery(
    async () => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const all = await db.tasks.where('status').equals('completed').toArray()
      return all.filter((t) => t.completedAt && t.completedAt >= start)
    },
    [],
    []
  )

  const totalSpent = useLiveQuery(
    async () => {
      const redemptions = await db.redemptions.toArray()
      return redemptions.reduce((sum, r) => sum + r.pointsSpent, 0)
    },
    [],
    0
  )

  const latestMood = useLiveQuery(
    async () => {
      const all = await db.moodEntries.orderBy('createdAt').reverse().first()
      return all ?? null
    },
    [],
    null
  )

  const topLevelActive = activeTasks.filter((t) => t.parentId === null)
  const recentTasks = topLevelActive.slice(0, 5)
  const completedCount = completedToday.length
  const total = topLevelActive.length + completedCount
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0
  const circumference = 2 * Math.PI * 42
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <div className="dashboard-grid">
      <section className="main-column">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-panel home-hero"
        >
          <div className="hero-copy">
            <h1>忙碌的工作也要慢下来，<span>好好生活</span></h1>
            <p>完成任务，收获奖励，记录心情，在点滴进步中遇见更从容的自己。</p>
          </div>
          <img className="hero-illustration desk-illustration" src="/illustrations/home-hero.png" alt="" aria-hidden="true" />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="content-card task-card"
        >
          <div className="section-title-row">
            <div>
              <h2>今日焦点任务</h2>
            </div>
            <span className="muted-label">{topLevelActive.length} 项任务</span>
          </div>

          {recentTasks.length > 0 ? (
            <div className="table-list">
              {recentTasks.map((task) => (
                <div key={task.id} className="task-row">
                  {task.status === 'completed'
                    ? <CheckCircle2 className="check-active" size={23} />
                    : <Circle className="check-muted" size={23} />
                  }
                  <span className="task-title">{task.title}</span>
                  <div className="task-row-status">
                    <span className={`soft-pill ${priorityClass[task.difficulty] ?? 'tone-blue'}`}>
                      {difficultyLabels[task.difficulty] ?? task.difficulty}
                    </span>
                    <span className="reward-text">{formatReward(task)}</span>
                    <span className={task.status === 'completed' ? 'status-pill done' : 'status-pill'}>
                      {task.status === 'completed' ? '已完成' : '进行中'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-list">
              {fallbackTasks.map((task) => (
                <div key={task.title} className="task-row">
                  <Circle className="check-muted" size={23} />
                  <span className="task-title">{task.title}</span>
                  <div className="task-row-status">
                    <span className={`soft-pill ${priorityClass[task.difficulty] ?? 'tone-blue'}`}>
                      {difficultyLabels[task.difficulty] ?? task.difficulty}
                    </span>
                    <span className="reward-text">{task.reward}</span>
                    <span className="status-pill">未开始</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={() => setCurrentPage('tasks')} className="text-link">
            查看全部任务 <ArrowRight size={16} />
          </button>
        </motion.section>

        <section className="reward-banner">
          <div>
            <p>小小进步，值得奖励</p>
            <span>你已经非常棒了，别忘了给自己一个大大的奖励。</span>
          </div>
          <button type="button" onClick={() => setCurrentPage('rewards')}>
            去奖励金库逛逛 <Gift size={17} />
          </button>
          <img className="pig-mini" src="/illustrations/reward-pig.png" alt="" aria-hidden="true" />
        </section>
      </section>

      <aside className="right-column">
        <div className="metric-card">
          <div>
            <p>今日进度</p>
            <strong>{progressPercent}%</strong>
            <span>已完成 {completedCount} / {total} 项任务</span>
          </div>
          <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
            <circle cx="46" cy="46" r="42" className="ring-bg" />
            <circle
              cx="46"
              cy="46"
              r="42"
              className="ring-fg"
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
        </div>

        <button type="button" onClick={() => setCurrentPage('rewards')} className="side-stat warm">
          <Wallet size={27} />
          <div>
            <span>已累计奖励</span>
            <strong>¥ {balance}</strong>
            <p>已兑换 ¥{totalSpent} · 可用余额 ¥{balance}</p>
          </div>
          <ArrowRight size={20} />
        </button>

        <div className="side-stat peach">
          <Flame size={27} />
          <div>
            <span>连续完成天数</span>
            <strong>{streakLength} 天</strong>
            <p>{streakLength > 0 ? '继续加油，保持节奏' : '完成任务开始连续打卡'}</p>
          </div>
        </div>

        <button type="button" onClick={() => setCurrentPage('mood')} className="side-stat blue">
          <Smile size={27} />
          <div>
            <span>心情状态</span>
            <strong>{latestMood ? `${latestMood.emoji}` : '暂无记录'}</strong>
            <p>{latestMood ? '很好，记得保持哦' : '点击记录今日心情'}</p>
          </div>
          <ArrowRight size={20} />
        </button>

        <div className="quick-card">
          <h3>快速添加任务 ✨</h3>
          <input readOnly value="" placeholder="输入任务名称..." />
          <button type="button" onClick={() => setCurrentPage('tasks')}>
            添加任务 <PlusCircle size={17} />
          </button>
        </div>
      </aside>
    </div>
  )
}

const fallbackTasks = [
  { title: '添加你的第一个任务', difficulty: 'easy', reward: '+ ¥10' },
] as const
