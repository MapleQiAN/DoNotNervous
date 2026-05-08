import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, subDays, addDays, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale/zh-CN'
import { useDailySummary, refreshDailySummary } from '../../hooks/useSummary'
import { useMoodEntriesForDate } from '../../hooks/useMoodEntries'
import { computeCurrentStreak } from '../../hooks/useStreaks'
import { useCompletedTasksForDate } from '../../hooks/useTaskQueries'
import { usePointLedgerForDate } from '../../hooks/usePoints'
import { MOOD_SCORE } from '../../domain/summary'
import { toDayKey } from '../../lib/date-utils'
import type { Task, MoodEntry, MoodEmoji } from '../../domain/types'

interface DailySummaryProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const MOOD_DESC: Record<string, string> = {
  '😊': '心情很好，继续保持~',
  '😌': '内心平静，好好享受',
  '🥳': '充满活力的一天',
  '💪': '今天很棒，为自己鼓掌',
  '😐': '心情稳定，也不错',
  '😔': '每个人都有低落的时候',
  '😰': '深呼吸，一切都会好',
  '😡': '生气是正常的，放松一下',
}

const DIFFICULTY_TAG: Record<string, { label: string; className: string }> = {
  easy: { label: '轻松', className: 'calm' },
  medium: { label: '协作', className: 'hope' },
  hard: { label: '专注', className: 'focus' },
}

function getTaskTag(task: Task): { label: string; className: string } | null {
  return DIFFICULTY_TAG[task.difficulty] ?? null
}

const moodScale = [
  { label: '愉快', color: 'var(--color-amber-500)' },
  { label: '平静', color: 'var(--color-sage-500)' },
  { label: '一般', color: 'var(--color-text-tertiary)' },
  { label: '低落', color: 'var(--color-amber-500)' },
  { label: '很糟', color: 'var(--color-coral-500)' },
]

function buildMoodCurve(entries: MoodEntry[]): Array<{ time: string; x: number; y: number; tone: string }> {
  if (entries.length === 0) return []
  const sorted = [...entries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const n = sorted.length
  const xStart = 34
  const xEnd = 488
  return sorted.map((entry, i) => {
    const score = MOOD_SCORE[entry.emoji as MoodEmoji] ?? 3
    const y = Math.round(162 - ((score - 1) / 4) * 128)
    const x = Math.round(n === 1 ? (xStart + xEnd) / 2 : xStart + (i / (n - 1)) * (xEnd - xStart))
    const tone = score >= 4 ? 'good' : score >= 3 ? 'plain' : 'calm'
    const d = new Date(entry.createdAt)
    const hour = d.getHours()
    const minute = d.getMinutes()
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    return { time, x, y, tone }
  })
}

function buildLinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
}

function buildFillPath(points: Array<{ x: number; y: number }>, bottom: number): string {
  if (points.length < 2) return ''
  const line = buildLinePath(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${line} L${last.x},${bottom} L${first.x},${bottom} Z`
}

export function DailySummary({ showToast: _showToast }: DailySummaryProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const dayKey = toDayKey(selectedDate)
  const [streakDays, setStreakDays] = useState(0)

  const summary = useDailySummary(dayKey)
  const prevDayKey = toDayKey(subDays(selectedDate, 1))
  const prevSummary = useDailySummary(prevDayKey)

  const completedTasks = useCompletedTasksForDate(dayKey) as Task[]

  const moodEntries = useMoodEntriesForDate(dayKey)

  const ledgerEntries = usePointLedgerForDate(dayKey)

  useEffect(() => {
    refreshDailySummary(dayKey).catch(() => { /* non-blocking */ })
  }, [dayKey])

  useEffect(() => {
    computeCurrentStreak().then(setStreakDays).catch(() => {})
  }, [])

  function goPrev() {
    setSelectedDate(prev => subDays(prev, 1))
  }

  function goNext() {
    setSelectedDate(prev => addDays(prev, 1))
  }

  const canGoNext = !isToday(selectedDate)
  const formattedDate = format(selectedDate, 'M月d日 EEE', { locale: zhCN })

  const tasksCompleted = summary?.tasksCompleted ?? 0
  const pointsEarned = summary?.pointsEarned ?? 0
  const dominantMood = summary?.dominantMood ?? null
  const prevTasks = prevSummary?.tasksCompleted ?? 0
  const prevPoints = prevSummary?.pointsEarned ?? 0

  const hasData = tasksCompleted > 0 || pointsEarned > 0 || moodEntries.length > 0

  const moodCurvePoints = buildMoodCurve(moodEntries)
  const moodLinePath = buildLinePath(moodCurvePoints)
  const moodFillPath = buildFillPath(moodCurvePoints, 190)

  const efficientPeriod = (() => {
    if (completedTasks.length === 0) return null
    const buckets = new Map<number, number>()
    for (const task of completedTasks) {
      if (task.completedAt) {
        const h = new Date(task.completedAt).getHours()
        buckets.set(h, (buckets.get(h) ?? 0) + 1)
      }
    }
    let best = 0
    let count = 0
    for (const [h, c] of buckets) { if (c > count) { count = c; best = h } }
    if (count === 0) return null
    const end = Math.min(best + 2, 23)
    return { range: `${String(best).padStart(2, '0')}:00-${String(end).padStart(2, '0')}:00`, count }
  })()

  const bestLedgerEntry = ledgerEntries.length > 0
    ? ledgerEntries.reduce((a, b) => a.amount > b.amount ? a : b)
    : null

  function trendText(current: number, previous: number, unit: string) {
    const diff = current - previous
    if (diff > 0) return { text: `较昨日 ↑${diff}${unit}`, direction: 'up' as const }
    if (diff < 0) return { text: `较昨日 ↓${Math.abs(diff)}${unit}`, direction: 'down' as const }
    return { text: '与昨日持平', direction: 'neutral' as const }
  }

  const tasksTrend = trendText(tasksCompleted, prevTasks, '个')
  const pointsTrend = trendText(pointsEarned, prevPoints, '分')

  const fadeVariants = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
  }

  return (
    <div className="daily-summary">
      {/* Date navigation */}
      <div className="summary-nav-bar">
        <button type="button" className="icon-button" onClick={goPrev} aria-label="前一天">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="summary-nav-date">{formattedDate}</span>
        <button
          type="button"
          className="icon-button"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="后一天"
          style={{ opacity: canGoNext ? 1 : 0.3 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {!hasData ? (
        <motion.div className="summary-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="summary-empty-emoji">🌱</span>
          这天还没有数据，开始完成任务来查看总结吧
        </motion.div>
      ) : (
        <>
          {/* Stat cards with trends */}
          <motion.div className="stats-strip stats-strip-3" variants={fadeVariants} initial="initial" animate="animate">
            <div className="summary-stat tone-green">
              <div className="summary-stat-visual">
                <div className="summary-stat-icon tone-green">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <span className="summary-stat-label">完成任务</span>
                  <span className="summary-stat-value">{tasksCompleted}</span>
                  <span className="summary-stat-unit">个</span>
                  <span className={`summary-stat-trend ${tasksTrend.direction}`}>{tasksTrend.text}</span>
                </div>
              </div>
            </div>

            <div className="summary-stat tone-amber">
              <div className="summary-stat-visual">
                <div className="summary-stat-icon tone-amber">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5L9.8 5.5L14 6.1L11 9.2L11.6 13.5L8 11.4L4.4 13.5L5 9.2L2 6.1L6.2 5.5L8 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <span className="summary-stat-label">获得积分</span>
                  <span className="summary-stat-value">{pointsEarned}</span>
                  <span className="summary-stat-unit">分</span>
                  <span className={`summary-stat-trend ${pointsTrend.direction}`}>{pointsTrend.text}</span>
                </div>
              </div>
            </div>

            <div className="summary-stat tone-mint">
              <div className="summary-stat-visual">
                <div className="summary-stat-icon tone-mint">
                  <span>{dominantMood ?? '🌈'}</span>
                </div>
                <div>
                  <span className="summary-stat-label">主导心情</span>
                  <span className="summary-stat-value mood-word">平静</span>
                  <span className="summary-stat-trend neutral">
                    {dominantMood ? (MOOD_DESC[dominantMood] ?? '心情稳定，继续保持~') : '记录心情查看趋势'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="daily-board">
            <div className="daily-main-grid">
              {/* Completed tasks */}
              <motion.section className="summary-section completed-card" variants={fadeVariants} initial="initial" animate="animate">
                <div className="summary-section-header">
                  <div className="summary-section-title">
                    <div className="title-icon" style={{ background: 'rgba(114, 157, 90, 0.12)', color: 'var(--color-sage-500)' }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    完成的任务
                  </div>
                  {completedTasks.length > 3 && (
                    <button type="button" className="summary-section-link">查看全部</button>
                  )}
                </div>
                <div className="summary-section-body">
                  {completedTasks.length > 0 ? (
                    completedTasks.slice(0, 5).map(task => {
                      const tag = getTaskTag(task)
                      return (
                        <div key={task.id} className="summary-task">
                          <div className="summary-task-check">&#10003;</div>
                          <span className="summary-task-name">{task.title}</span>
                          {task.completedAt && (
                            <span className="summary-task-time">{format(task.completedAt, 'HH:mm')}</span>
                          )}
                          {tag && <span className={`summary-task-tag ${tag.className}`}>{tag.label}</span>}
                        </div>
                      )
                    })
                  ) : (
                    <div className="summary-empty" style={{ padding: '16px 0' }}>
                      这天还没有完成任务，明天继续加油
                    </div>
                  )}
                </div>
              </motion.section>

              {/* Mood entries */}
              <motion.section className="summary-section mood-card" variants={fadeVariants} initial="initial" animate="animate">
                <div className="summary-section-header">
                  <div className="summary-section-title">
                    <div className="title-icon" style={{ background: 'rgba(62, 175, 124, 0.12)', color: 'var(--color-mint-500)' }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                        <circle cx="6" cy="7" r="0.8" fill="currentColor" />
                        <circle cx="10" cy="7" r="0.8" fill="currentColor" />
                        <path d="M6 10C6.5 10.8 9.5 10.8 10 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                    </div>
                    心情记录
                  </div>
                  <button type="button" className="small-select">全天</button>
                </div>
                <div className="summary-section-body mood-body">
                  {moodCurvePoints.length > 0 ? (
                    <div className="mood-chart-shell">
                      <div className="mood-scale">
                        {moodScale.map(item => (
                          <span key={item.label} style={{ color: item.color }}>{item.label}</span>
                        ))}
                      </div>
                      <svg className="mood-line-chart" viewBox="0 0 520 190" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                          <linearGradient id="dailyMoodFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(114, 157, 90, 0.20)" />
                            <stop offset="100%" stopColor="rgba(114, 157, 90, 0.02)" />
                          </linearGradient>
                        </defs>
                        {[34, 66, 98, 130, 162].map(y => (
                          <line key={y} x1="0" x2="520" y1={y} y2={y} className="mood-grid-line" />
                        ))}
                        {moodCurvePoints.length >= 2 && (
                          <>
                            <path d={moodFillPath} className="mood-fill" />
                            <path d={moodLinePath} className="mood-line" />
                          </>
                        )}
                        {moodCurvePoints.map(point => (
                          <g key={point.time}>
                            <circle cx={point.x} cy={point.y} r="11" className={`mood-dot ${point.tone}`} />
                            <circle cx={point.x} cy={point.y} r="4" className="mood-dot-core" />
                          </g>
                        ))}
                      </svg>
                      <div className="mood-time-axis">
                        {moodCurvePoints.map(point => <span key={point.time}>{point.time}</span>)}
                      </div>
                    </div>
                  ) : (
                    <div className="summary-empty" style={{ padding: '16px 0' }}>
                      这天还没有心情记录
                    </div>
                  )}
                  <div className="mood-timeline">
                    {moodEntries.slice(0, 4).map(entry => (
                      <div key={entry.id} className="summary-mood-row">
                        <span className="summary-mood-time">{format(entry.createdAt, 'HH:mm')}</span>
                        <div className="summary-mood-content">
                          <div className="summary-mood-label">{entry.label}</div>
                          {entry.journal && (
                            <div className="summary-mood-journal">{entry.journal}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            </div>

            <motion.aside className="daily-insight-rail" variants={fadeVariants} initial="initial" animate="animate">
              <div className="rail-title">
                <LeafIcon />
                <span>今日洞察</span>
              </div>
              {efficientPeriod && (
                <div className="rail-card">
                  <FlowerIcon />
                  <div>
                    <strong>高效时段 {efficientPeriod.range}</strong>
                    <p>完成了 {efficientPeriod.count} 个任务，效率和质量都很棒！</p>
                  </div>
                </div>
              )}
              {moodEntries.length > 0 && dominantMood && (
                <div className="rail-card">
                  <RunIcon />
                  <div>
                    <strong>今天心情{MOOD_DESC[dominantMood] ? '不错' : '平稳'}</strong>
                    <p>{MOOD_DESC[dominantMood] ?? '继续关注自己的感受，保持好状态。'}</p>
                  </div>
                </div>
              )}
              {streakDays > 0 && (
                <div className="rail-card">
                  <NotebookIcon />
                  <div>
                    <strong>坚持记录 {streakDays} 天</strong>
                    <p>持续记录心情，你在认真照顾自己的感受！</p>
                  </div>
                </div>
              )}
              {!efficientPeriod && moodEntries.length === 0 && streakDays === 0 && (
                <div className="rail-card">
                  <FlowerIcon />
                  <div>
                    <strong>开始记录吧</strong>
                    <p>完成任务和记录心情后，这里会出现个性化洞察。</p>
                  </div>
                </div>
              )}
              <img className="rail-sofa" src="/illustrations/sofa.png" alt="" aria-hidden="true" />
            </motion.aside>

            <div className="daily-bottom-grid">
              <motion.section className="summary-section ledger-card" variants={fadeVariants} initial="initial" animate="animate">
                <div className="summary-section-header">
                  <div className="summary-section-title">
                    <div className="title-icon" style={{ background: 'rgba(234, 179, 8, 0.12)', color: 'var(--color-amber-500)' }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M8 5V11M6 7H10M6.5 9H9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                    </div>
                    积分明细
                  </div>
                </div>
                <div className="summary-section-body">
                  <div className="ledger-head"><span>来源任务</span><span>积分</span><span>时间</span></div>
                  {ledgerEntries.length > 0 ? (
                    ledgerEntries.slice(0, 3).map(entry => (
                      <div key={entry.id} className="summary-ledger-row">
                        <span className="summary-ledger-reason">{entry.reason}</span>
                        <span className={`summary-ledger-amount ${entry.amount > 0 ? 'positive' : 'negative'}`}>
                          {entry.amount > 0 ? '+' : ''}{entry.amount}
                        </span>
                        <span className="summary-ledger-time">{format(entry.createdAt, 'HH:mm')}</span>
                      </div>
                    ))
                  ) : (
                    <div className="summary-empty" style={{ padding: '16px 0' }}>
                      这天没有积分变动
                    </div>
                  )}
                  <div className="ledger-total"><span>今日总计</span><strong>+{pointsEarned} 分</strong></div>
                </div>
              </motion.section>

              <motion.div className="summary-insights" variants={fadeVariants} initial="initial" animate="animate">
                <div className="summary-insight efficiency-card">
                  <div className="summary-insight-icon" style={{ background: 'rgba(114, 157, 90, 0.12)' }}>
                    <ClockIcon />
                  </div>
                  <div className="summary-insight-title">高效时段</div>
                  <div className="summary-insight-value">{efficientPeriod?.range ?? '--'}</div>
                  <div className="summary-insight-desc">{efficientPeriod ? `完成 ${efficientPeriod.count} 个任务，获得 ${pointsEarned} 积分` : '完成任务最集中的时段'}</div>
                </div>
                <div className="summary-insight achievement-card">
                  <div className="summary-insight-icon" style={{ background: 'rgba(250, 204, 21, 0.12)' }}>
                    <TrophyIcon />
                  </div>
                  <div className="summary-insight-title">最有成就感任务</div>
                  <div className="summary-insight-value">{bestLedgerEntry?.reason ?? '--'}</div>
                  <div className="summary-insight-desc">{bestLedgerEntry ? `带来 ${bestLedgerEntry.amount} 积分，成就感满满！` : '得分最高的任务'}</div>
                  <img className="insight-plant" src="/illustrations/heart_plant.png" alt="" aria-hidden="true" />
                </div>
                <div className="summary-insight streak-card">
                  <div className="summary-insight-icon" style={{ background: 'rgba(224, 122, 95, 0.12)' }}>
                    <FlameIcon />
                  </div>
                  <div className="summary-insight-title">连续记录</div>
                  <div className="summary-insight-value">{streakDays > 0 ? `${streakDays} 天` : '--'}</div>
                  <div className="summary-insight-desc">{streakDays > 0 ? '坚持记录心情，继续保持！' : '开始记录来建立连续记录'}</div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M14.5 3.5C9.4 3.5 5.4 6.2 4.3 11.7C8.7 12.1 12.8 9.8 14.5 3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 14.5C5.5 10.2 8.6 7.8 12.2 6.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function FlowerIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <circle cx="19" cy="19" r="17" fill="rgba(114,157,90,0.12)" />
      <path d="M19 10V28M10 19H28M12.6 12.6L25.4 25.4M25.4 12.6L12.6 25.4" stroke="#7ea15d" strokeWidth="2" strokeLinecap="round" />
      <circle cx="19" cy="19" r="5" fill="#8fb773" />
    </svg>
  )
}

function RunIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <circle cx="19" cy="19" r="17" fill="rgba(114,157,90,0.12)" />
      <circle cx="21" cy="11" r="3" fill="#8fb773" />
      <path d="M18 16L14 21L20 23L18 30M19 17L24 20L28 18M16 24L11 27" stroke="#7ea15d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NotebookIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <circle cx="19" cy="19" r="17" fill="rgba(234,179,8,0.12)" />
      <rect x="12" y="9" width="16" height="21" rx="3" fill="#fff8e6" stroke="#caa85b" strokeWidth="1.4" />
      <path d="M16 15H24M16 20H24M16 25H21" stroke="#8fb773" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 13H14M11 18H14M11 23H14" stroke="#caa85b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 5.8V9.3L11.5 10.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M6 3H12V7.4C12 9.2 10.8 10.5 9 10.5C7.2 10.5 6 9.2 6 7.4V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 4.5H3.8C3.8 6.4 4.6 7.5 6 8M12 4.5H14.2C14.2 6.4 13.4 7.5 12 8M9 10.5V13M6.8 15H11.2M7.5 13H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9.2 2.5C9.2 2.5 5 6.7 5 10.3C5 12.7 6.8 14.5 9 14.5C11.2 14.5 13 12.7 13 10.3C13 8.3 12.1 6.8 10.8 5.4C10.5 6.6 9.8 7.4 8.9 7.8C9.3 5.8 9.2 2.5 9.2 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
