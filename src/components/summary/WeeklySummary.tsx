import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, subWeeks, addWeeks, parse, addDays } from 'date-fns'
import { zhCN } from 'date-fns/locale/zh-CN'
import { useWeeklySummary, refreshWeeklySummary } from '../../hooks/useSummary'
import { getWeekRange } from '../../domain/summary'

const MOCK = true

interface WeeklySummaryProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

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

  // Previous week for trend comparison
  const prevWeekDate = subWeeks(parse(selectedWeekStart, 'yyyy-MM-dd', new Date()), 1)
  const prevWeekKey = getWeekRange(prevWeekDate).startDayKey
  const prevSummary = useWeeklySummary(prevWeekKey)

  useEffect(() => {
    if (!MOCK) refreshWeeklySummary(selectedWeekStart).catch(() => { /* non-blocking */ })
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

  const weekStartDate = parse(selectedWeekStart, 'yyyy-MM-dd', new Date())
  const weekEndDate = addDays(weekStartDate, 6)
  const formattedRange = `${format(weekStartDate, 'M月d日', { locale: zhCN })} - ${format(weekEndDate, 'M月d日', { locale: zhCN })}`

  const fadeVariants = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
  }

  const hasData = MOCK || (summary != null && (summary.totalTasksCompleted > 0 || summary.totalPointsEarned > 0 || summary.avgMoodScore > 0))

  const isMockWeek = MOCK && selectedWeekStart === currentWeekStart

  const mockDailyBreakdown = [
    { date: selectedWeekStart, tasksCompleted: 2, pointsEarned: 18, moodScore: 4, compositeScore: 4.2 },
    { date: format(addDays(weekStartDate, 1), 'yyyy-MM-dd'), tasksCompleted: 5, pointsEarned: 36, moodScore: 3, compositeScore: 3.1 },
    { date: format(addDays(weekStartDate, 2), 'yyyy-MM-dd'), tasksCompleted: 3, pointsEarned: 24, moodScore: 5, compositeScore: 4.8 },
    { date: format(addDays(weekStartDate, 3), 'yyyy-MM-dd'), tasksCompleted: 6, pointsEarned: 42, moodScore: 3, compositeScore: 2.9 },
    { date: format(addDays(weekStartDate, 4), 'yyyy-MM-dd'), tasksCompleted: 5, pointsEarned: 32, moodScore: 4, compositeScore: 4.0 },
    { date: format(addDays(weekStartDate, 5), 'yyyy-MM-dd'), tasksCompleted: 9, pointsEarned: 62, moodScore: 5, compositeScore: 3.7 },
    { date: format(addDays(weekStartDate, 6), 'yyyy-MM-dd'), tasksCompleted: 8, pointsEarned: 54, moodScore: 4, compositeScore: 2.8 },
  ]

  // Trend calculations
  const totalTasks = isMockWeek ? 23 : (summary?.totalTasksCompleted ?? 0)
  const totalPoints = isMockWeek ? 168 : (summary?.totalPointsEarned ?? 0)
  const avgMood = isMockWeek ? 4.2 : (summary?.avgMoodScore ?? 0)
  const rewardAmount = isMockWeek ? 96 : (summary?.totalPointsSpent ?? 0)
  const prevTotalTasks = isMockWeek ? 20 : (prevSummary?.totalTasksCompleted ?? 0)
  const prevTotalPoints = isMockWeek ? 144 : (prevSummary?.totalPointsEarned ?? 0)
  const prevAvgMood = isMockWeek ? 3.6 : (prevSummary?.avgMoodScore ?? 0)
  const prevRewardAmount = isMockWeek ? 66 : (prevSummary?.totalPointsSpent ?? 0)

  const displayDailyBreakdown = isMockWeek ? mockDailyBreakdown : (summary?.dailyBreakdown ?? [])

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

  const taskCategories = [
    { label: '工作', count: 8, percent: 34.8, color: '#78b85f' },
    { label: '生活', count: 6, percent: 26.1, color: '#f4c75b' },
    { label: '健身', count: 5, percent: 21.7, color: '#b69be8' },
    { label: '学习', count: 4, percent: 17.4, color: '#8fbce8' },
  ]

  const insightCards = [
    { title: '周三效率最高', desc: '完成 3 个任务，专注力达到峰值', tone: 'leaf' },
    { title: '运动日心情更稳定', desc: '运动的 3 天里，心情均在 4 分以上', tone: 'walk' },
    { title: '下午 14:00-16:00 最专注', desc: '高效任务集中在这个时段', tone: 'smile' },
  ]

  const adviceCards = [
    { title: '保持运动习惯', desc: '每周 3 次刚刚好，继续加油' },
    { title: '尝试深度专注', desc: '每天留出 1-2 小时专注重要事项' },
    { title: '给自己留白时间', desc: '安排一些放松时光，让身心好好休息' },
  ]

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
                    <circle cx="60" cy="60" r="38" className="donut-seg work" strokeDasharray="82 239" strokeDashoffset="0" />
                    <circle cx="60" cy="60" r="38" className="donut-seg life" strokeDasharray="62 239" strokeDashoffset="-82" />
                    <circle cx="60" cy="60" r="38" className="donut-seg fitness" strokeDasharray="52 239" strokeDashoffset="-144" />
                    <circle cx="60" cy="60" r="38" className="donut-seg study" strokeDasharray="42 239" strokeDashoffset="-196" />
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
                  {insightCards.map(item => (
                    <div key={item.title} className="weekly-mini-card">
                      <WeeklyMiniIcon tone={item.tone} />
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  ))}
                </div>
                <img className="weekly-room-sofa" src="/illustrations/sofa.png" alt="" aria-hidden="true" />
              </div>
            </motion.section>

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
                <div className="weekly-highlight-item">
                  <DocumentIcon />
                  <strong>完成项目方案初稿</strong>
                  <span>提前 2 天完成，专注投入，成果满满</span>
                </div>
                <div className="weekly-highlight-item">
                  <DumbbellIcon />
                  <strong>健身 3 次</strong>
                  <span>本周坚持运动，身体是革命的本钱</span>
                </div>
                <div className="weekly-highlight-item">
                  <SmileIcon />
                  <strong>记录心情 5 天</strong>
                  <span>连续记录不断线，更了解自己的情绪</span>
                </div>
                <div className="weekly-highlight-item">
                  <BookIcon />
                  <strong>阅读 60 页</strong>
                  <span>累计阅读约 4h，持续成长的一周</span>
                </div>
              </div>
            </motion.section>

            <motion.section className="summary-section weekly-advice-card weekly-room-card" variants={fadeVariants} initial="initial" animate="animate">
              <div className="summary-section-header">
                <div className="summary-section-title">
                  <div className="title-icon" style={{ background: 'rgba(224, 122, 95, 0.12)', color: 'var(--color-coral-500)' }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M8 13C4.5 10.7 2.5 8.8 2.5 6.2C2.5 4.6 3.6 3.5 5.1 3.5C6.1 3.5 7.1 4.1 8 5.1C8.9 4.1 9.9 3.5 10.9 3.5C12.4 3.5 13.5 4.6 13.5 6.2C13.5 8.8 11.5 10.7 8 13Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                  </div>
                  下周温柔建议
                </div>
              </div>
              <div className="summary-section-body weekly-advice-grid">
                {adviceCards.map(item => (
                  <div key={item.title} className="weekly-mini-card advice">
                    <CoffeeIcon />
                    <strong>{item.title}</strong>
                    <span>{item.desc}</span>
                  </div>
                ))}
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

function DumbbellIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <path d="M7 18V24M11 15V27M15 18V24M27 18V24M31 15V27M35 18V24M15 21H27" stroke="#8f82d9" strokeWidth="3" strokeLinecap="round" />
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

function BookIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <path d="M10 10H19C21 10 22 11.2 22 13.2V33C21.2 31.8 19.9 31 18 31H10V10Z" fill="#fff3e6" stroke="#dc9a6d" strokeWidth="1.5" />
      <path d="M32 10H25C23 10 22 11.2 22 13.2V33C22.8 31.8 24.1 31 26 31H32V10Z" fill="#ffe9d8" stroke="#dc9a6d" strokeWidth="1.5" />
      <path d="M14 16H18M26 16H30M14 21H18M26 21H30" stroke="#c98359" strokeWidth="1.4" strokeLinecap="round" />
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
