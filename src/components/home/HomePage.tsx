import { useCallback } from 'react'
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
import { useUIStore } from '../../stores/uiStore'
import type { Task } from '../../domain/types'

interface HomePageProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const focusRows = [
  { title: '完成项目方案初稿', time: '10:00 截止', tag: '专注', tone: 'tone-focus', reward: '+ ¥35', status: '已完成', statusTone: 'done', complete: true },
  { title: '与团队同步需求', time: '14:00 截止', tag: '期待', tone: 'tone-hope', reward: '+ ¥20', status: '进行中', statusTone: 'progress', complete: false },
  { title: '健身 30 分钟', time: '18:30 截止', tag: '活力', tone: 'tone-energy', reward: '+ ¥15', status: '未开始', statusTone: '', complete: false },
  { title: '阅读 20 页', time: '21:30 截止', tag: '平静', tone: 'tone-calm', reward: '+ ¥10', status: '未开始', statusTone: '', complete: false },
  { title: '睡前记录心情', time: '22:30 截止', tag: '放松', tone: 'tone-relax', reward: '+ ¥10', status: '未开始', statusTone: '', complete: false },
]

const taskTagMap: Record<string, Pick<(typeof focusRows)[number], 'tag' | 'tone'>> = {
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

function formatReward(task: Task) {
  if (task.difficulty === 'hard') return '+ ¥35'
  if (task.difficulty === 'medium') return '+ ¥20'
  return '+ ¥10'
}

function formatTaskTime(task: Task, index: number) {
  void task
  return focusRows[index % focusRows.length].time
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
  const total = topLevelActive.length + completedCount || 5
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0
  const visiblePercent = progressPercent || 60
  const circumference = 2 * Math.PI * 42
  const strokeDashoffset = circumference - (visiblePercent / 100) * circumference
  const moodLabel = latestMood ? moodLabelMap[latestMood.label] ?? '平静' : '平静'
  const displayTasks = topLevelActive.length > 0
    ? topLevelActive.slice(0, 5).map((task, index) => {
        const tag = taskTagMap[task.difficulty] ?? focusRows[index % focusRows.length]
        const isDone = task.status === 'completed'
        return {
          id: task.id,
          title: task.title,
          time: formatTaskTime(task, index),
          tag: tag.tag,
          tone: tag.tone,
          reward: formatReward(task),
          status: isDone ? '已完成' : '未开始',
          statusTone: isDone ? 'done' : '',
          complete: isDone,
        }
      })
    : focusRows.map((row) => ({ ...row, id: null as string | null }))

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
              {topLevelActive.length || 5} 项任务
            </span>
          </div>

          <div className="table-list">
            {displayTasks.map((task) => (
              <div key={task.id ?? task.title} className={`task-row ${task.complete ? 'is-completed' : ''}`}>
                {task.complete ? (
                  <span
                    className="check-active"
                    role="button"
                    tabIndex={0}
                    onClick={task.id ? () => void handleToggleTask(task.id!, true) : undefined}
                    onKeyDown={(e) => { if (e.key === 'Enter' && task.id) void handleToggleTask(task.id!, true) }}
                  >
                    <Check size={16} strokeWidth={3} />
                  </span>
                ) : (
                  <Circle
                    className="check-muted clickable"
                    size={24}
                    onClick={task.id ? () => void handleToggleTask(task.id!, false) : undefined}
                  />
                )}
                <span className="task-title">{task.title}</span>
                <span className="row-time">
                  <Clock3 size={14} />
                  {task.time}
                </span>
                <span className={`soft-pill ${task.tone}`}>{task.tag}</span>
                <span className="reward-text">{task.reward}</span>
                <span className={`status-pill ${task.statusTone}`}>{task.status}</span>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => setCurrentPage('tasks')} className="text-link">
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
              <strong>{visiblePercent}%</strong>
              <span>已完成 {completedCount || 3} / {total || 5} 项任务</span>
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
          onClick={() => setCurrentPage('rewards')}
          className="side-stat warm"
        >
          <BadgeDollarSign size={27} />
          <div>
            <span>已累计奖励</span>
            <strong>¥ {balance || 235}</strong>
            <p>可用余额 <b>¥{balance || 168}</b></p>
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
            <strong>{streakLength || 12} <small>天</small></strong>
            <p>{streakLength > 0 ? '继续加油，保持节奏！' : '继续加油，保持节奏！'}</p>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          type="button"
          onClick={() => setCurrentPage('mood')}
          className="side-stat blue"
        >
          <Smile size={27} />
          <div>
            <span>心情状态</span>
            <strong>{moodLabel}</strong>
            <p>很棒！记得保持哦～</p>
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
                <input readOnly value="20" aria-label="奖励金额" />
                <TimerReset size={15} />
              </div>
            </label>
            <label className="quick-field">
              <span>心情感受</span>
              <button type="button" onClick={() => setCurrentPage('mood')} className="quick-select">
                <Smile size={18} />
                平静
                <ChevronDown size={15} />
              </button>
            </label>
          </div>
          <button type="button" onClick={() => setCurrentPage('tasks')} className="quick-submit">
            添加任务 <PlusCircle size={17} />
          </button>
        </motion.div>

        <section className="reward-banner">
          <Leaf className="banner-leaf" size={31} strokeWidth={1.8} />
          <div>
            <p>小小进步，值得奖励</p>
            <span>你已经非常棒了！别忘了给自己一个大大的奖励～</span>
          </div>
          <button type="button" onClick={() => setCurrentPage('rewards')}>
            去奖励金库逛逛 <Gift size={16} />
          </button>
          <img className="pig-mini" src="/illustrations/reward-pig.png" alt="" aria-hidden="true" />
        </section>
      </aside>
    </div>
  )
}
