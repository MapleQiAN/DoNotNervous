import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Flame,
  Gift,
  Leaf,
  PlusCircle,
  Smile,
  Sparkles,
  Sprout,
  Sun,
  TimerReset,
} from 'lucide-react'
import { db } from '../../db'
import { usePointBalance } from '../../hooks/usePoints'
import { useCurrentStreak } from '../../hooks/useStreaks'
import { completeTask, uncompleteTask } from '../../hooks/useTaskActions'
import type { Task } from '../../domain/types'

interface HomePageProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const taskTagMap: Record<string, { tag: string; tone: string }> = {
  hard: { tag: '专注', tone: 'tone-focus' },
  medium: { tag: '期待', tone: 'tone-hope' },
  easy: { tag: '活力', tone: 'tone-energy' },
}

const moodLabelMap: Record<string, string> = {
  happy: '开心',
  calm: '平静',
  neutral: '平稳',
  sad: '低落',
  anxious: '焦虑',
  angry: '烦躁',
  excited: '兴奋',
  strong: '有力',
}

const REWARD_BY_DIFFICULTY: Record<string, string> = {
  hard: '+ ¥35',
  medium: '+ ¥20',
  easy: '+ ¥10',
}

function formatReward(task: Task) {
  return REWARD_BY_DIFFICULTY[task.difficulty] ?? '+ ¥10'
}

function formatTaskTime(task: Task): string {
  if (task.completedAt) {
    const h = task.completedAt.getHours()
    const m = task.completedAt.getMinutes()
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} 完成`
  }
  if (task.createdAt) {
    const h = task.createdAt.getHours()
    const m = task.createdAt.getMinutes()
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} 创建`
  }
  return ''
}

export function HomePage({ showToast: _showToast }: HomePageProps) {
  void _showToast
  const balance = usePointBalance()
  const streakLength = useCurrentStreak()
  const navigate = useNavigate()

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

  const latestMood = useLiveQuery(
    async () => {
      const all = await db.moodEntries.orderBy('createdAt').reverse().first()
      return all ?? null
    },
    [],
    null
  )

  const topLevelActive = activeTasks.filter((t) => t.parentId === null)
  const completedCount = completedToday.length
  const total = topLevelActive.length + completedCount
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0
  const circumference = 2 * Math.PI * 42
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference
  const moodLabel = latestMood ? moodLabelMap[latestMood.label] ?? '平静' : '平静'

  const displayTasks = topLevelActive.slice(0, 5).map((task) => {
    const tagInfo = taskTagMap[task.difficulty] ?? { tag: '任务', tone: 'tone-calm' }
    const isDone = task.status === 'completed'
    return {
      id: task.id,
      title: task.title,
      time: formatTaskTime(task),
      tag: tagInfo.tag,
      tone: tagInfo.tone,
      reward: formatReward(task),
      status: isDone ? '已完成' : '未开始',
      statusTone: isDone ? 'done' : '',
      complete: isDone,
    }
  })

  const handleToggleTask = useCallback(async (taskId: string, isComplete: boolean) => {
    if (isComplete) {
      await uncompleteTask(taskId)
    } else {
      await completeTask(taskId)
    }
  }, [])

  return (
    <div className="dashboard-grid home-dashboard">
      <section className="main-column home-main-column">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-panel home-hero"
        >
          <div className="hero-copy">
            <h1>
              忙碌的工作也要慢下来，
              <span>好好生活 <Sun size={34} strokeWidth={1.9} /></span>
            </h1>
            <p>
              完成任务，收获奖励，记录心情，
              <br />
              在点滴进步中遇见更从容的自己。
            </p>
          </div>
          <img
            className="hero-illustration desk-illustration"
            src="/illustrations/home-hero.png"
            alt=""
            aria-hidden="true"
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="content-card task-card"
        >
          <div className="section-title-row">
            <h2>今日焦点任务</h2>
            <span className="muted-label">
              <Clock3 size={14} />
              {total} 项任务
            </span>
          </div>

          {displayTasks.length > 0 ? (
            <div className="table-list">
              {displayTasks.map((task) => (
                <div key={task.id} className={`task-row ${task.complete ? 'is-completed' : ''}`}>
                  {task.complete ? (
                    <span
                      className="check-active"
                      role="button"
                      tabIndex={0}
                      onClick={() => void handleToggleTask(task.id, true)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void handleToggleTask(task.id, true) }}
                    >
                      <Check size={16} strokeWidth={3} />
                    </span>
                  ) : (
                    <Circle
                      className="check-muted clickable"
                      size={24}
                      onClick={() => void handleToggleTask(task.id, false)}
                    />
                  )}
                  <span className="task-title">{task.title}</span>
                  {task.time && (
                    <span className="row-time">
                      <Clock3 size={14} />
                      {task.time}
                    </span>
                  )}
                  <span className={`soft-pill ${task.tone}`}>{task.tag}</span>
                  <span className="reward-text">{task.reward}</span>
                  <span className={`status-pill ${task.statusTone}`}>{task.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="summary-empty" style={{ padding: '24px 0' }}>
              还没有任务，去添加一些吧
            </div>
          )}

          <button type="button" onClick={() => navigate('/tasks')} className="text-link">
            查看全部任务 <ArrowRight size={15} />
          </button>
        </motion.section>
      </section>

      <aside className="right-column home-right-column">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="metric-card progress-card"
        >
          <div className="metric-copy">
            <span className="metric-icon soft-cycle"><Sprout size={22} /></span>
            <div>
              <p>今日进度</p>
              <strong>{progressPercent}%</strong>
              <span>已完成 {completedCount} / {total} 项任务</span>
            </div>
          </div>
          <svg width="86" height="86" viewBox="0 0 92 92" aria-hidden="true">
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

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          type="button"
          onClick={() => navigate('/rewards')}
          className="side-stat warm"
        >
          <BadgeDollarSign size={27} />
          <div>
            <span>已累计奖励</span>
            <strong>¥ {balance}</strong>
            <p>可用余额 <b>¥{balance}</b></p>
          </div>
          <ChevronRight size={20} className="side-arrow" />
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="side-stat peach"
        >
          <Flame size={27} />
          <div>
            <span>连续完成天数</span>
            <strong>{streakLength} <small>天</small></strong>
            <p>{streakLength > 0 ? '继续加油，保持节奏！' : '开始完成任务建立连续记录'}</p>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          type="button"
          onClick={() => navigate('/mood')}
          className="side-stat blue"
        >
          <Smile size={27} />
          <div>
            <span>心情状态</span>
            <strong>{moodLabel}</strong>
            <p>{latestMood ? '很棒！记得保持哦～' : '记录心情了解自己'}</p>
          </div>
          <ChevronRight size={20} className="side-arrow" />
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="quick-card home-quick-card"
        >
          <h3>快速添加任务 <Sparkles size={16} /></h3>
          <label className="quick-field quick-name">
            <span>任务名称</span>
            <input readOnly value="" placeholder="输入任务名称..." />
            <CalendarPlus size={16} />
          </label>
          <div className="quick-grid">
            <label className="quick-field">
              <span>奖励金额</span>
              <div className="quick-input-shell">
                <em>¥</em>
                <input readOnly value="" aria-label="奖励金额" />
                <TimerReset size={15} />
              </div>
            </label>
            <label className="quick-field">
              <span>心情感受</span>
              <button type="button" onClick={() => navigate('/mood')} className="quick-select">
                <Smile size={18} />
                {moodLabel}
                <ChevronDown size={15} />
              </button>
            </label>
          </div>
          <button type="button" onClick={() => navigate('/tasks')} className="quick-submit">
            添加任务 <PlusCircle size={17} />
          </button>
        </motion.div>

      </aside>

      <section className="reward-banner">
        <Leaf className="banner-leaf" size={31} strokeWidth={1.8} />
        <div>
          <p>小小进步，值得奖励</p>
          <span>你已经非常棒了！别忘了给自己一个大大的奖励～</span>
        </div>
        <button type="button" onClick={() => navigate('/rewards')}>
          去奖励金库逛逛 <Gift size={16} />
        </button>
        <img className="pig-mini" src="/illustrations/reward-pig.png" alt="" aria-hidden="true" />
      </section>
    </div>
  )
}
