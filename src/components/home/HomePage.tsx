import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Circle, Clock3, Flame, Smile, Wallet } from 'lucide-react'
import { db } from '../../db'
import { usePointBalance } from '../../hooks/usePoints'
import { useCurrentStreak } from '../../hooks/useStreaks'
import { useUIStore } from '../../stores/uiStore'
import type { Task } from '../../domain/types'

interface HomePageProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const moodConfig: { label: string; tone: string }[] = [
  { label: '专注', tone: 'tone-focus' },
  { label: '期待', tone: 'tone-hope' },
  { label: '活力', tone: 'tone-energy' },
  { label: '平静', tone: 'tone-calm' },
  { label: '放松', tone: 'tone-relax' },
]

const statusConfig: Record<number, { label: string; className: string }> = {
  0: { label: '已完成', className: 'status-pill done' },
  1: { label: '进行中', className: 'status-pill progress' },
}

function formatReward(task: Task) {
  if (task.difficulty === 'hard') return '¥35'
  if (task.difficulty === 'medium') return '¥20'
  return '¥10'
}

function formatTime(index: number) {
  return ['10:00', '14:00', '18:30', '21:30', '22:30'][index] ?? '今天'
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

  const topLevelActive = activeTasks.filter((t) => t.parentId === null)
  const recentTasks = topLevelActive.slice(0, 5)
  const completedCount = completedToday.length
  const total = topLevelActive.length + completedCount
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 60
  const circumference = 2 * Math.PI * 42
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <div className="dashboard-grid">
      {/* ─── Left Column ─── */}
      <section className="main-column">
        {/* Hero Welcome Card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-panel home-hero"
        >
          <div className="hero-copy">
            <h1>
              忙碌的工作也要慢下来，<br />
              <span>好好生活 ☀️</span>
            </h1>
            <p>
              完成任务，收获奖励，记录心情，
              <br />
              在点滴进步中更从容。
            </p>
          </div>
          <img
            className="hero-illustration desk-illustration"
            src="/illustrations/home-hero.png"
            alt=""
            aria-hidden="true"
          />
        </motion.section>

        {/* Today's Focus Tasks Card */}
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
            <span className="muted-label" style={{ color: 'var(--color-text-tertiary)', fontSize: 13, fontWeight: 600 }}>
              {topLevelActive.length} 项任务
            </span>
          </div>

          <div className="table-list">
            {(recentTasks.length > 0 ? recentTasks : fallbackTasks).map((task, index) => {
              const isFallback = !('id' in task)
              const title = task.title
              const mood = moodConfig[index % moodConfig.length]
              const status = statusConfig[index] ?? { label: '未开始', className: 'status-pill' }
              const isDone = index === 0

              return (
                <div key={isFallback ? title : (task as Task & { id: string }).id} className="task-row">
                  {isDone ? (
                    <CheckCircle2 className="check-active" size={20} />
                  ) : (
                    <Circle className="check-muted" size={20} />
                  )}
                  <span className="task-title">{title}</span>
                  <span className="row-time">
                    <Clock3 size={13} />
                    {formatTime(index)}
                  </span>
                  <span className={`soft-pill ${mood.tone}`}>{mood.label}</span>
                  <span className="reward-text">
                    {isFallback ? task.reward : formatReward(task as Task)}
                  </span>
                  <span className={status.className}>{status.label}</span>
                </div>
              )
            })}
          </div>

          <button type="button" onClick={() => setCurrentPage('tasks')} className="text-link">
            查看全部任务 <ArrowRight size={15} />
          </button>
        </motion.section>

        {/* Reward Banner */}
        <section className="reward-banner">
          <div>
            <p>小小进步，值得奖励</p>
            <span>你已经非常棒了！别忘了给自己一个大大的奖励～</span>
          </div>
          <button type="button" onClick={() => setCurrentPage('rewards')}>
            去奖励金库逛逛 🎁
          </button>
          <img className="pig-mini" src="/illustrations/reward-pig.png" alt="" aria-hidden="true" />
        </section>
      </section>

      {/* ─── Right Column ─── */}
      <aside className="right-column">
        {/* Today's Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="metric-card"
        >
          <div>
            <p>今日进度</p>
            <strong>{progressPercent}%</strong>
            <span>已完成 {completedCount} / {Math.max(total, 5)} 项任务</span>
          </div>
          <svg width="88" height="88" viewBox="0 0 92 92" aria-hidden="true">
            <circle cx="46" cy="46" r="42" className="ring-bg" />
            <circle
              cx="46"
              cy="46"
              r="42"
              className="ring-fg"
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
        </motion.div>

        {/* Accumulated Rewards */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          type="button"
          onClick={() => setCurrentPage('rewards')}
          className="side-stat warm"
        >
          <Wallet size={24} />
          <div>
            <span>已累计奖励</span>
            <strong>¥ {balance}</strong>
            <p>可用余额 ¥{Math.max(0, balance - 67)}</p>
          </div>
          <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
        </motion.button>

        {/* Streak Days */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="side-stat peach"
        >
          <Flame size={24} style={{ color: 'var(--color-warm-400)' }} />
          <div>
            <span>连续完成天数</span>
            <strong>{streakLength || 12} 天</strong>
            <p>继续加油，保持节奏！</p>
          </div>
        </motion.div>

        {/* Mood Status */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          type="button"
          onClick={() => setCurrentPage('mood')}
          className="side-stat blue"
        >
          <Smile size={24} style={{ color: '#6ba5c8' }} />
          <div>
            <span>心情状态</span>
            <strong>平静 😊</strong>
            <p>很棒！记得保持哦～</p>
          </div>
          <ArrowRight size={18} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
        </motion.button>

        {/* Quick Add Task */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="quick-card"
        >
          <h3>快速添加任务 ✨</h3>
          <input readOnly value="" placeholder="输入任务名称..." />
          <div className="quick-grid">
            <span>¥ 20</span>
            <span>😊 平静</span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage('tasks')}
            className="primary-wide"
            style={{ borderRadius: 12, fontSize: 14, fontWeight: 700 }}
          >
            添加任务 ⊕
          </button>
        </motion.div>
      </aside>
    </div>
  )
}

const fallbackTasks = [
  { title: '完成项目方案初稿', difficulty: 'hard' as const, reward: '¥35' },
  { title: '与团队同步需求', difficulty: 'medium' as const, reward: '¥20' },
  { title: '健身 30 分钟', difficulty: 'easy' as const, reward: '¥15' },
  { title: '阅读 20 页', difficulty: 'easy' as const, reward: '¥10' },
  { title: '睡前记录心情', difficulty: 'easy' as const, reward: '¥10' },
] as const
