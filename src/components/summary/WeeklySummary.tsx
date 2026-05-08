import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, subWeeks, addWeeks, parse, addDays } from 'date-fns'
import { zhCN } from 'date-fns/locale/zh-CN'
import { useLiveQuery } from 'dexie-react-hooks'
import { useWeeklySummary, refreshWeeklySummary } from '../../hooks/useSummary'
import { getWeekRange } from '../../domain/summary'
import { db } from '../../db'

interface WeeklySummaryProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

const CATEGORY_COLORS: Record<string, string> = {
  work: '#78b85f',
  wellness: '#b69be8',
  growth: '#8fbce8',
  life: '#f4c75b',
}

const CATEGORY_LABELS: Record<string, string> = {
  work: '工作',
  wellness: '健康',
  growth: '学习',
  life: '生活',
}

function moodScoreToTone(score: number): string {
  if (score >= 4) return 'good'
  if (score >= 3) return 'plain'
  if (score >= 1) return 'low'
  return 'empty'
}

export function WeeklySummary({ showToast: _showToast }: WeeklySummaryProps) {
  void _showToast

  const [selectedWeekStart, setSelectedWeekStart] = useState(
    () => getWeekRange(new Date()).startDayKey,
  )
  const summary = useWeeklySummary(selectedWeekStart)

  const currentWeekStart = getWeekRange(new Date()).startDayKey

  const prevWeekDate = subWeeks(parse(selectedWeekStart, 'yyyy-MM-dd', new Date()), 1)
  const prevWeekKey = getWeekRange(prevWeekDate).startDayKey
  const prevSummary = useWeeklySummary(prevWeekKey)

  const weekStartDate = parse(selectedWeekStart, 'yyyy-MM-dd', new Date())
  const weekEndDate = addDays(weekStartDate, 6)

  const weeklyTasks = useLiveQuery(
    async () => {
      const start = new Date(`${selectedWeekStart}T00:00:00`)
      const end = new Date(`${format(weekEndDate, 'yyyy-MM-dd')}T23:59:59.999`)
      const tasks = await db.tasks
        .where('completedAt')
        .between(start, end, true, true)
        .filter(task => task.status === 'completed')
        .toArray()
      return tasks
    },
    [selectedWeekStart],
    [],
  )

  useEffect(() => {
    refreshWeeklySummary(selectedWeekStart).catch(() => { /* non-blocking */ })
  }, [selectedWeekStart])

  function goPrevWeek() {
    const prevDate = subWeeks(parse(selectedWeekStart, 'yyyy-MM-dd', new Date()), 1)
    setSelectedWeekStart(getWeekRange(prevDate).startDayKey)
  }

  function goNextWeek() {
    const nextDate = addWeeks(parse(selectedWeekStart, 'yyyy-MM-dd', new Date()), 1)
    setSelectedWeekStart(getWeekRange(nextDate).startDayKey)
  }

  const canGoNext = selectedWeekStart < currentWeekStart

  const formattedRange = `${format(weekStartDate, 'M月d日', { locale: zhCN })} - ${format(weekEndDate, 'M月d日', { locale: zhCN })}`

  const fadeVariants = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
  }

  const totalTasks = summary?.totalTasksCompleted ?? 0
  const totalPoints = summary?.totalPointsEarned ?? 0
  const avgMood = summary?.avgMoodScore ?? 0
  const rewardAmount = summary?.totalPointsSpent ?? 0
  const prevTotalTasks = prevSummary?.totalTasksCompleted ?? 0
  const prevTotalPoints = prevSummary?.totalPointsEarned ?? 0
  const prevAvgMood = prevSummary?.avgMoodScore ?? 0
  const prevRewardAmount = prevSummary?.totalPointsSpent ?? 0

  const displayDailyBreakdown = summary?.dailyBreakdown ?? []

  const hasData = summary != null && (totalTasks > 0 || totalPoints > 0 || avgMood > 0)

  // Compute task categories from real task data
  const taskCategories = (() => {
    if (weeklyTasks.length === 0) return []
    const counts = new Map<string, number>()
    for (const task of weeklyTasks) {
      const cat = task.category ?? 'other'
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
    const total = weeklyTasks.length
    return Array.from(counts.entries())
      .map(([cat, count]) => ({
        label: CATEGORY_LABELS[cat] ?? cat,
        count,
        percent: Math.round((count / total) * 100),
        color: CATEGORY_COLORS[cat] ?? '#ccc',
      }))
      .sort((a, b) => b.count - a.count)
  })()

  function trendText(current: number, previous: number, unit: string) {
    const diff = Number((current - previous).toFixed(1))
    if (diff > 0) return { text: `较上周 ↑${diff}${unit}`, direction: 'up' as const }
    if (diff < 0) return { text: `较上周 ↓${Math.abs(diff)}${unit}`, direction: 'down' as const }
    return { text: '与上周持平', direction: 'neutral' as const }
  }

  const tasksTrend = trendText(totalTasks, prevTotalTasks, '个')
  const pointsTrend = trendText(totalPoints, prevTotalPoints, '分')
  const moodTrend = trendText(Number(avgMood.toFixed(1)), Number(prevAvgMood.toFixed(1)), '')
  const rewardTrend = trendText(rewardAmount, prevRewardAmount, '元')

  const taskPathPoints = displayDailyBreakdown.map((day, index) => {
    const x = 46 + index * 85
    const y = 154 - (Math.min(day.tasksCompleted, 12) / 12) * 118
    return `${x},${y}`
  }).join(' ')

  const moodPathPoints = displayDailyBreakdown.map((day, index) => {
    const x = 46 + index * 85
    const y = 154 - (Math.min(day.moodScore, 5) / 5) * 118
    return `${x},${y}`
  }).join(' ')

  // Compute best day from daily breakdown
  const bestDay = displayDailyBreakdown.length > 0
    ? displayDailyBreakdown.reduce((a, b) => a.compositeScore > b.compositeScore ? a : b)
    : null

  const bestDayLabel = bestDay
    ? format(parse(bestDay.date, 'yyyy-MM-dd', new Date()), 'M月d日 EEE', { locale: zhCN })
    : null

  // Compute highlights from real data
  const highlights = (() => {
    const items: Array<{ icon: 'task' | 'mood' | 'streak'; title: string; desc: string }> = []
    if (totalTasks > 0) {
      items.push({
        icon: 'task',
        title: `完成 ${totalTasks} 个任务`,
        desc: totalTasks >= prevTotalTasks ? '比上周更高效，继续保持' : '每一份努力都值得肯定',
      })
    }
    if (avgMood > 0) {
      items.push({
        icon: 'mood',
        title: `平均心情 ${avgMood.toFixed(1)} 分`,
        desc: avgMood >= 4 ? '整体心情不错，继续保持好状态' : '关注自己的感受，给自己多一些关爱',
      })
    }
    if (summary?.streakDays && summary.streakDays > 0) {
      items.push({
        icon: 'streak',
        title: `连续活跃 ${summary.streakDays} 天`,
        desc: '坚持就是最好的成长，为你点赞',
      })
    }
    if (totalPoints > 0) {
      items.push({
        icon: 'task',
        title: `获得 ${totalPoints} 积分`,
        desc: rewardAmount > 0 ? `已兑换 ${rewardAmount} 积分的奖励` : '积攒积分兑换喜欢的奖励',
      })
    }
    return items
  })()

  return (
    <div className="weekly-summary">
      {/* Week navigation */}
      <div className="summary-nav-bar">
        <button type="button" className="icon-button" onClick={goPrevWeek} aria-label="上一周">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="summary-nav-date">{formattedRange}</span>
        <button
          type="button"
          className="icon-button"
          onClick={goNextWeek}
          disabled={!canGoNext}
          aria-label="下一周"
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
          这周还没有数据，开始完成任务来查看总结吧
        </motion.div>
      ) : (
        <>
          {/* Stat cards with trends */}
          <motion.div className="stats-strip" variants={fadeVariants} initial="initial" animate="animate">
            <div className="summary-stat tone-green">
              <div className="summary-stat-visual">
                <div className="summary-stat-icon tone-green">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <span className="summary-stat-label">完成任务</span>
                  <span className="summary-stat-value">{totalTasks}</span>
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
                  <span className="summary-stat-value">{totalPoints}</span>
                  <span className="summary-stat-unit">分</span>
                  <span className={`summary-stat-trend ${pointsTrend.direction}`}>{pointsTrend.text}</span>
                </div>
              </div>
            </div>

            <div className="summary-stat tone-mint">
              <div className="summary-stat-visual">
                <div className="summary-stat-icon tone-mint">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="6" cy="7" r="0.8" fill="currentColor" />
                    <circle cx="10" cy="7" r="0.8" fill="currentColor" />
                    <path d="M6 10C6.5 10.8 9.5 10.8 10 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <span className="summary-stat-label">平均心情</span>
                  <span className="summary-stat-value">{avgMood.toFixed(1)}</span>
                  <span className="summary-stat-unit">/ 5</span>
                  <span className={`summary-stat-trend ${moodTrend.direction}`}>{moodTrend.text}</span>
                </div>
              </div>
            </div>

            <div className="summary-stat tone-coral">
              <div className="summary-stat-visual">
                <div className="summary-stat-icon tone-coral">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="4" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M11 6.2H14V10H11C9.8 10 9 9.2 9 8.1C9 7 9.8 6.2 11 6.2Z" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5.2 6.2H8.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <span className="summary-stat-label">奖励累计</span>
                  <span className="summary-stat-value">¥ {rewardAmount}</span>
                  <span className={`summary-stat-trend ${rewardTrend.direction}`}>{rewardTrend.text}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="weekly-board">
            {displayDailyBreakdown.length > 0 && (
              <motion.section className="summary-section weekly-chart-card task-trend-card" variants={fadeVariants} initial="initial" animate="animate">
                <div className="summary-section-header">
                  <div className="summary-section-title">
                    <div className="title-icon" style={{ background: 'rgba(114, 157, 90, 0.12)', color: 'var(--color-sage-500)' }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    本周任务完成趋势
                  </div>
                  <button type="button" className="small-select">按完成数量</button>
                </div>
                <div className="summary-section-body weekly-chart-body">
                  <div className="weekly-y-axis task-axis">
                    {[12, 9, 6, 3, 0].map(value => <span key={value}>{value}</span>)}
                  </div>
                  <svg className="weekly-line-chart" viewBox="0 0 600 180" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="weeklyTaskFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(114, 157, 90, 0.28)" />
                        <stop offset="100%" stopColor="rgba(114, 157, 90, 0.02)" />
                      </linearGradient>
                    </defs>
                    {[36, 65.5, 95, 124.5, 154].map(y => (
                      <line key={y} x1="34" x2="566" y1={y} y2={y} className="weekly-grid-line" />
                    ))}
                    <polygon points={`46,154 ${taskPathPoints} 556,154`} className="weekly-area-fill" />
                    <polyline points={taskPathPoints} className="weekly-task-line" />
                    {displayDailyBreakdown.map((day, index) => {
                      const x = 46 + index * 85
                      const y = 154 - (Math.min(day.tasksCompleted, 12) / 12) * 118
                      return (
                        <g key={day.date}>
                          <rect x={x - 14} y={y + 9} width="28" height={154 - y - 9} rx="9" className="weekly-task-bar" />
                          <circle cx={x} cy={y} r="6" className="weekly-task-dot" />
                          <text x={x} y={y - 13} textAnchor="middle" className="weekly-chart-value">{day.tasksCompleted}</text>
                        </g>
                      )
                    })}
                  </svg>
                  <div className="weekly-x-axis">
                    {DAY_LABELS.map(label => <span key={label}>周{label}</span>)}
                  </div>
                </div>
              </motion.section>
            )}

            {displayDailyBreakdown.length > 0 && (
              <motion.section className="summary-section weekly-chart-card mood-trend-card" variants={fadeVariants} initial="initial" animate="animate">
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
                    本周情绪变化
                  </div>
                  <button type="button" className="small-select">本周平均 {avgMood.toFixed(1)}/5</button>
                </div>
                <div className="summary-section-body weekly-chart-body mood-chart-body">
                  <div className="weekly-y-axis mood-axis">
                    {['很好', '较好', '一般', '较差', '很差'].map(value => <span key={value}>{value}</span>)}
                  </div>
                  <svg className="weekly-line-chart" viewBox="0 0 600 180" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="weeklyMoodFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(114, 157, 90, 0.20)" />
                        <stop offset="100%" stopColor="rgba(114, 157, 90, 0.03)" />
                      </linearGradient>
                    </defs>
                    {[36, 65.5, 95, 124.5, 154].map(y => (
                      <line key={y} x1="34" x2="566" y1={y} y2={y} className="weekly-grid-line" />
                    ))}
                    <polygon points={`46,154 ${moodPathPoints} 556,154`} className="weekly-mood-fill" />
                    <polyline points={moodPathPoints} className="weekly-task-line" />
                    {displayDailyBreakdown.map((day, index) => {
                      const x = 46 + index * 85
                      const y = 154 - (Math.min(day.moodScore, 5) / 5) * 118
                      return (
                        <g key={day.date}>
                          <circle cx={x} cy={y} r="9" className={`weekly-mood-face ${moodScoreToTone(day.moodScore)}`} />
                          <circle cx={x - 3} cy={y - 2} r="1.1" className="weekly-mood-eye" />
                          <circle cx={x + 3} cy={y - 2} r="1.1" className="weekly-mood-eye" />
                          <path d={`M ${x - 4} ${y + 3} Q ${x} ${y + 6} ${x + 4} ${y + 3}`} className="weekly-mood-mouth" />
                        </g>
                      )
                    })}
                  </svg>
                  <div className="weekly-x-axis">
                    {DAY_LABELS.map(label => <span key={label}>周{label}</span>)}
                  </div>
                </div>
              </motion.section>
            )}

            {taskCategories.length > 0 && (
              <motion.section className="summary-section weekly-category-card" variants={fadeVariants} initial="initial" animate="animate">
                <div className="summary-section-header">
                  <div className="summary-section-title">
                    <div className="title-icon" style={{ background: 'rgba(114, 157, 90, 0.12)', color: 'var(--color-sage-500)' }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M3 3V13H13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        <path d="M5 11L8 8L10 9.8L13 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    本周完成任务分类
                  </div>
                </div>
                <div className="summary-section-body weekly-category-body">
                  <div className="weekly-donut" aria-hidden="true">
                    <svg viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="38" className="donut-track" />
                      {(() => {
                        const circumference = 2 * Math.PI * 38
                        let offset = 0
                        return taskCategories.map((cat, i) => {
                          const segLen = (cat.percent / 100) * circumference
                          const el = (
                            <circle
                              key={cat.label}
                              cx="60" cy="60" r="38"
                              className={`donut-seg ${['work', 'life', 'fitness', 'study'][i % 4]}`}
                              strokeDasharray={`${segLen} ${circumference - segLen}`}
                              strokeDashoffset={`${-offset}`}
                              style={{ stroke: cat.color }}
                            />
                          )
                          offset += segLen
                          return el
                        })
                      })()}
                    </svg>
                    <div><strong>{totalTasks}</strong><span>总任务</span></div>
                  </div>
                  <div className="weekly-category-list">
                    {taskCategories.map(item => (
                      <div key={item.label} className="weekly-category-row">
                        <span className="weekly-category-dot" style={{ background: item.color }} />
                        <span className="weekly-category-name">{item.label}</span>
                        <span className="weekly-category-bar"><i style={{ width: `${item.percent * 1.9}%`, background: item.color }} /></span>
                        <strong>{item.count} 个</strong>
                        <em>{item.percent}%</em>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            <motion.section className="summary-section weekly-insight-card weekly-room-card" variants={fadeVariants} initial="initial" animate="animate">
              <div className="summary-section-header">
                <div className="summary-section-title">
                  <div className="title-icon" style={{ background: 'rgba(114, 157, 90, 0.12)', color: 'var(--color-sage-500)' }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3C5 5 4 8 4 13C7.5 12.6 10 10.5 10.2 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.5 3.2C10.5 3 12.2 3.8 13 5.5C11.8 7 10.2 7.3 8.8 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  本周洞察
                </div>
              </div>
              <div className="summary-section-body weekly-insight-body">
                <div className="weekly-insight-grid">
                  {bestDay && bestDayLabel && (
                    <div className="weekly-mini-card">
                      <WeeklyMiniIcon tone="leaf" />
                      <strong>{bestDayLabel}效率最高</strong>
                      <span>综合评分 {bestDay.compositeScore.toFixed(1)}，完成 {bestDay.tasksCompleted} 个任务</span>
                    </div>
                  )}
                  {avgMood > 0 && (
                    <div className="weekly-mini-card">
                      <WeeklyMiniIcon tone="smile" />
                      <strong>本周心情均分 {avgMood.toFixed(1)}</strong>
                      <span>{avgMood >= 4 ? '整体心情不错，继续保持好状态' : '关注自己的感受，给自己多一些关爱'}</span>
                    </div>
                  )}
                  {totalTasks > prevTotalTasks && prevTotalTasks > 0 && (
                    <div className="weekly-mini-card">
                      <WeeklyMiniIcon tone="walk" />
                      <strong>比上周多完成 {totalTasks - prevTotalTasks} 个任务</strong>
                      <span>效率在提升，继续加油</span>
                    </div>
                  )}
                  {!bestDay && avgMood === 0 && totalTasks === 0 && (
                    <div className="weekly-mini-card">
                      <WeeklyMiniIcon tone="leaf" />
                      <strong>开始新的一周</strong>
                      <span>完成任务和记录心情后，这里会出现洞察</span>
                    </div>
                  )}
                </div>
                <img className="weekly-room-sofa" src="/illustrations/sofa.png" alt="" aria-hidden="true" />
              </div>
            </motion.section>

            {highlights.length > 0 && (
              <motion.section className="summary-section weekly-highlight-card" variants={fadeVariants} initial="initial" animate="animate">
                <div className="summary-section-header">
                  <div className="summary-section-title">
                    <div className="title-icon" style={{ background: 'rgba(250, 204, 21, 0.14)', color: 'var(--color-amber-500)' }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M5 2.5H11V6.5C11 8.4 9.8 9.6 8 9.6C6.2 9.6 5 8.4 5 6.5V2.5Z" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M5 4H3.2C3.2 5.5 3.9 6.5 5 7M11 4H12.8C12.8 5.5 12.1 6.5 11 7M8 9.6V12M5.8 13.5H10.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </div>
                    本周高光时刻
                  </div>
                </div>
                <div className="summary-section-body weekly-highlight-grid">
                  {highlights.slice(0, 4).map(item => (
                    <div key={item.title} className="weekly-highlight-item">
                      {item.icon === 'task' && <DocumentIcon />}
                      {item.icon === 'mood' && <SmileIcon />}
                      {item.icon === 'streak' && <FlameHighlightIcon />}
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            <motion.section className="summary-section weekly-advice-card weekly-room-card" variants={fadeVariants} initial="initial" animate="animate">
              <div className="summary-section-header">
                <div className="summary-section-title">
                  <div className="title-icon" style={{ background: 'rgba(224, 122, 95, 0.12)', color: 'var(--color-coral-500)' }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M8 13C4.5 10.7 2.5 8.8 2.5 6.2C2.5 4.6 3.6 3.5 5.1 3.5C6.1 3.5 7.1 4.1 8 5.1C8.9 4.1 9.9 3.5 10.9 3.5C12.4 3.5 13.5 4.6 13.5 6.2C13.5 8.8 11.5 10.7 8 13Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                  </div>
                  温柔建议
                </div>
              </div>
              <div className="summary-section-body weekly-advice-grid">
                <div className="weekly-mini-card advice">
                  <CoffeeIcon />
                  <strong>保持规律作息</strong>
                  <span>稳定的作息是一切的基础</span>
                </div>
                <div className="weekly-mini-card advice">
                  <CoffeeIcon />
                  <strong>给自己留白时间</strong>
                  <span>安排一些放松时光，让身心好好休息</span>
                </div>
                <div className="weekly-mini-card advice">
                  <CoffeeIcon />
                  <strong>记录你的感受</strong>
                  <span>写下来本身就是一种疗愈</span>
                </div>
              </div>
            </motion.section>
          </div>
        </>
      )}
    </div>
  )
}

function WeeklyMiniIcon({ tone }: { tone: string }) {
  if (tone === 'walk') return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="rgba(114,157,90,0.12)" />
      <circle cx="19" cy="10" r="2.6" fill="#7ea15d" />
      <path d="M16 14L12.5 19L18 21L16.5 27M18 15L23 17.5L26 16M14 22L9.5 25" stroke="#7ea15d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (tone === 'smile') return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="rgba(250,204,21,0.14)" />
      <circle cx="17" cy="17" r="8" stroke="#d69b28" strokeWidth="1.6" />
      <circle cx="14" cy="15.5" r="1" fill="#d69b28" />
      <circle cx="20" cy="15.5" r="1" fill="#d69b28" />
      <path d="M13.5 19C14.5 20.8 19.5 20.8 20.5 19" stroke="#d69b28" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="rgba(114,157,90,0.12)" />
      <path d="M20.5 7C15 8.2 12 12.4 12.4 20C18.6 19.2 21.5 15.1 20.5 7Z" stroke="#7ea15d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 26C11.8 19.5 15.4 15.2 19.2 11.8" stroke="#7ea15d" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <rect x="10" y="6" width="22" height="30" rx="3" fill="#eef8e8" stroke="#8fb773" strokeWidth="1.5" />
      <path d="M26 6V13H32" fill="#d8edc8" />
      <path d="M15 20H27M15 25H25M15 30H23" stroke="#7ea15d" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SmileIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <circle cx="21" cy="21" r="13" fill="#dff5ff" stroke="#7dc2dd" strokeWidth="1.6" />
      <circle cx="16.5" cy="18.5" r="1.5" fill="#64aeca" />
      <circle cx="25.5" cy="18.5" r="1.5" fill="#64aeca" />
      <path d="M15.5 24C17 27 25 27 26.5 24" stroke="#64aeca" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function FlameHighlightIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <circle cx="21" cy="21" r="13" fill="#fff5eb" stroke="#d99462" strokeWidth="1.6" />
      <path d="M21 11C21 11 15 16 15 22C15 25.3 17.7 28 21 28C24.3 28 27 25.3 27 22C27 18.7 25.2 16.3 23 14.5C22.5 16.5 21.2 17.8 19.5 18.2C20.5 15 21 11 21 11Z" stroke="#d99462" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CoffeeIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="rgba(224,122,95,0.10)" />
      <path d="M10 15H22V20C22 23 19.8 25 16.5 25C13.2 25 10 23 10 20V15Z" fill="#fff5eb" stroke="#d99462" strokeWidth="1.6" />
      <path d="M22 17H24.5C26 17 26.8 18 26.8 19.2C26.8 20.5 25.8 21.5 24.4 21.5H22" stroke="#d99462" strokeWidth="1.6" />
      <path d="M13 10V12M17 9V12M21 10V12" stroke="#d99462" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
