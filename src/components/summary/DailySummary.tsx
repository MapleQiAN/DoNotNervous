import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CheckSquare, Wallet, Smile } from 'lucide-react'
import { format, subDays, addDays, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale/zh-CN'
import { useLiveQuery } from 'dexie-react-hooks'
import { useDailySummary, refreshDailySummary } from '../../hooks/useSummary'
import { useMoodEntriesForDate } from '../../hooks/useMoodEntries'
import { toDayKey } from '../../lib/date-utils'
import { db } from '../../db'
import type { Task, PointLedgerEntry } from '../../domain/types'

interface DailySummaryProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

export function DailySummary({ showToast: _showToast }: DailySummaryProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const dayKey = toDayKey(selectedDate)

  const summary = useDailySummary(dayKey)

  const completedTasks = useLiveQuery(
    async () => {
      const start = new Date(`${dayKey}T00:00:00`)
      const end = new Date(`${dayKey}T23:59:59.999`)
      const tasks = await db.tasks
        .where('completedAt')
        .between(start, end, true, true)
        .filter(task => task.status === 'completed')
        .toArray()
      return tasks.sort((a, b) => {
        const aTime = a.completedAt?.getTime() ?? 0
        const bTime = b.completedAt?.getTime() ?? 0
        return bTime - aTime
      })
    },
    [dayKey],
    [] as Task[],
  )

  const moodEntries = useMoodEntriesForDate(dayKey)

  const ledgerEntries = useLiveQuery(
    async () => {
      const start = new Date(`${dayKey}T00:00:00`)
      const end = new Date(`${dayKey}T23:59:59.999`)
      const entries = await db.pointLedger
        .where('createdAt')
        .between(start, end, true, true)
        .toArray()
      return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },
    [dayKey],
    [] as PointLedgerEntry[],
  )

  useEffect(() => {
    refreshDailySummary(dayKey).catch(() => { /* non-blocking */ })
  }, [dayKey])

  function goPrev() {
    setSelectedDate(prev => subDays(prev, 1))
  }

  function goNext() {
    setSelectedDate(prev => addDays(prev, 1))
  }

  const canGoNext = !isToday(selectedDate)
  const formattedDate = format(selectedDate, 'M月d日 EEE', { locale: zhCN })

  const fadeVariants = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
  }

  return (
    <div className="daily-summary">
      {/* Arrow navigation bar (D-06) */}
      <div className="content-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <button type="button" className="icon-button" onClick={goPrev} aria-label="前一天">
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontWeight: 600, fontSize: '15px' }}>{formattedDate}</span>
        <button
          type="button"
          className="icon-button"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="后一天"
          style={{ opacity: canGoNext ? 1 : 0.3 }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Stats row (D-05) */}
      <motion.div className="stats-strip" variants={fadeVariants} initial="initial" animate="animate">
        <div className="stat-card">
          <div className="stat-icon"><CheckSquare size={18} /></div>
          <div>
            <span>完成任务</span>
            <strong>{summary?.tasksCompleted ?? 0} 个</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Wallet size={18} /></div>
          <div>
            <span>获得积分</span>
            <strong>{summary?.pointsEarned ?? 0} 分</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Smile size={18} /></div>
          <div>
            <span>主导心情</span>
            <strong>{summary?.dominantMood ?? '暂无'}</strong>
          </div>
        </div>
      </motion.div>

      {/* Completed tasks list */}
      <motion.section className="content-card" variants={fadeVariants} initial="initial" animate="animate">
        <h3>完成的任务</h3>
        {completedTasks.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {completedTasks.map(task => (
              <li key={task.id} className="record-row">
                <span style={{ color: 'var(--color-success)' }}>&#10003;</span>
                <span>{task.title}</span>
                {task.completedAt && (
                  <em>{format(task.completedAt, 'HH:mm')}</em>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>这天还没有完成任务，明天继续加油</p>
        )}
      </motion.section>

      {/* Mood entries list */}
      <motion.section className="content-card" variants={fadeVariants} initial="initial" animate="animate">
        <h3>心情记录</h3>
        {moodEntries.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {moodEntries.map(entry => (
              <li key={entry.id} className="record-row">
                <span style={{ fontSize: '20px' }}>{entry.emoji}</span>
                <div style={{ flex: 1 }}>
                  <span>{entry.label}</span>
                  {entry.journal && <p style={{ margin: '4px 0 0', color: 'var(--color-muted)', fontSize: '13px' }}>{entry.journal}</p>}
                </div>
                <em>{format(entry.createdAt, 'HH:mm')}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>这天还没有记录心情</p>
        )}
      </motion.section>

      {/* Point transactions list */}
      <motion.section className="content-card" variants={fadeVariants} initial="initial" animate="animate">
        <h3>积分明细</h3>
        {ledgerEntries.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {ledgerEntries.map(entry => (
              <li key={entry.id} className="record-row">
                <strong style={{ color: entry.amount > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {entry.amount > 0 ? '+' : ''}{entry.amount}
                </strong>
                <span>{entry.reason}</span>
                <em>{format(entry.createdAt, 'HH:mm')}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>这天没有积分变动</p>
        )}
      </motion.section>
    </div>
  )
}
