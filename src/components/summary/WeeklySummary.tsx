import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, subWeeks, addWeeks, parse, addDays } from 'date-fns'
import { zhCN } from 'date-fns/locale/zh-CN'
import { Trophy, Calendar, TrendingUp, Flame, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { useWeeklySummary, refreshWeeklySummary } from '../../hooks/useSummary'
import { getWeekRange } from '../../domain/summary'
import { toDayKey } from '../../lib/date-utils'
import { db } from '../../db'

interface WeeklySummaryProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function moodScoreToColor(score: number): string {
  if (score >= 4) return '#4ade80'
  if (score >= 3) return '#a3e635'
  if (score >= 2) return '#facc15'
  if (score >= 1) return '#fb923c'
  return 'var(--color-muted)'
}

export function WeeklySummary({ showToast }: WeeklySummaryProps) {
  const [selectedWeekStart, setSelectedWeekStart] = useState(
    () => getWeekRange(new Date()).startDayKey,
  )
  const summary = useWeeklySummary(selectedWeekStart)
  const [showDayPicker, setShowDayPicker] = useState(false)

  const currentWeekStart = getWeekRange(new Date()).startDayKey

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

  const weekStartDate = parse(selectedWeekStart, 'yyyy-MM-dd', new Date())
  const weekEndDate = addDays(weekStartDate, 6)
  const formattedRange = `${format(weekStartDate, 'M月d日', { locale: zhCN })} - ${format(weekEndDate, 'M月d日', { locale: zhCN })}`

  async function handlePickDay(dayIndex: number) {
    const chosenDate = format(addDays(weekStartDate, dayIndex), 'yyyy-MM-dd')
    try {
      await db.weeklySummaries.update(selectedWeekStart, {
        userBestDayOverride: chosenDate,
      })
      await refreshWeeklySummary(selectedWeekStart)
      showToast('已选择你的最佳一天')
    } catch {
      showToast('保存失败', 'error')
    }
    setShowDayPicker(false)
  }

  async function handleAcceptSuggestion() {
    showToast('感谢你的认可，继续加油')
  }

  const bestDay = summary?.userBestDayOverride ?? summary?.bestDayDate
  const bestDayData = summary?.dailyBreakdown.find(d => d.date === bestDay)

  const fadeVariants = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
  }

  const hasData = summary && (summary.totalTasksCompleted > 0 || summary.totalPointsEarned > 0 || summary.avgMoodScore > 0)

  return (
    <div className="weekly-summary">
      {/* Week navigation bar */}
      <div className="content-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <button type="button" className="icon-button" onClick={goPrevWeek} aria-label="上一周">
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontWeight: 600, fontSize: '15px' }}>{formattedRange}</span>
        <button
          type="button"
          className="icon-button"
          onClick={goNextWeek}
          disabled={!canGoNext}
          aria-label="下一周"
          style={{ opacity: canGoNext ? 1 : 0.3 }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {!hasData ? (
        <motion.div className="content-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '24px 0' }}>
            这周还没有数据，开始完成任务来查看总结吧
          </p>
        </motion.div>
      ) : (
        <>
          {/* Stats row (D-07) */}
          <motion.div className="stats-strip" variants={fadeVariants} initial="initial" animate="animate">
            <div className="stat-card">
              <div className="stat-icon"><Calendar size={18} /></div>
              <div>
                <span>完成任务</span>
                <strong>{summary.totalTasksCompleted} 个</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><TrendingUp size={18} /></div>
              <div>
                <span>获得积分</span>
                <strong>{summary.totalPointsEarned} 分</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Sparkles size={18} /></div>
              <div>
                <span>平均心情</span>
                <strong>{summary.avgMoodScore.toFixed(1)} / 5</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Flame size={18} /></div>
              <div>
                <span>连续天数</span>
                <strong>{summary.streakDays} 天</strong>
              </div>
            </div>
          </motion.div>

          {/* Completion rate (D-13) */}
          <motion.section className="content-card" variants={fadeVariants} initial="initial" animate="animate">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3>完成率</h3>
              <strong style={{ fontSize: '18px' }}>
                {Math.round(summary.completionRate * 100)}%
              </strong>
            </div>
            <div style={{
              background: 'var(--color-border)',
              borderRadius: '8px',
              height: '8px',
              overflow: 'hidden',
            }}>
              <div style={{
                background: 'var(--color-success)',
                borderRadius: '8px',
                height: '100%',
                width: `${Math.round(summary.completionRate * 100)}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--color-muted)' }}>
              完成 {summary.totalTasksCompleted} / 创建 {summary.totalTasksCreated} 个任务
            </p>
          </motion.section>

          {/* Best day highlight card (D-11, D-12) */}
          <motion.section className="content-card" variants={fadeVariants} initial="initial" animate="animate">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy size={18} style={{ color: '#facc15' }} /> 最佳一天
            </h3>

            {bestDay && bestDayData ? (
              <div>
                {summary.userBestDayOverride ? (
                  <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                    你的选择: {format(parse(bestDay, 'yyyy-MM-dd', new Date()), 'M月d日 EEE', { locale: zhCN })}
                  </p>
                ) : (
                  <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                    推荐最佳: {format(parse(bestDay, 'yyyy-MM-dd', new Date()), 'M月d日 EEE', { locale: zhCN })}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', marginBottom: '12px' }}>
                  <span>任务 {bestDayData.tasksCompleted} 个</span>
                  <span>积分 {bestDayData.pointsEarned} 分</span>
                  <span>心情 {bestDayData.moodScore > 0 ? bestDayData.moodScore : '暂无'}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {!summary.userBestDayOverride && (
                    <button
                      type="button"
                      className="small-select"
                      onClick={handleAcceptSuggestion}
                    >
                      认同推荐
                    </button>
                  )}
                  <button
                    type="button"
                    className="small-select"
                    onClick={() => setShowDayPicker(prev => !prev)}
                  >
                    {summary.userBestDayOverride ? '重新选择' : '选择自己的最佳一天'}
                  </button>
                </div>

                <AnimatePresence>
                  {showDayPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', marginTop: '12px' }}
                    >
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {summary.dailyBreakdown.map((day, index) => (
                          <button
                            key={day.date}
                            type="button"
                            className={`small-select ${bestDay === day.date ? 'is-active' : ''}`}
                            onClick={() => handlePickDay(index)}
                          >
                            周{DAY_LABELS[index]}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                本周暂无最佳一天数据
              </p>
            )}
          </motion.section>

          {/* Mood trajectory mini section */}
          <motion.section className="content-card" variants={fadeVariants} initial="initial" animate="animate">
            <h3>心情轨迹</h3>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', justifyContent: 'space-around', padding: '12px 0' }}>
              {summary.dailyBreakdown.map((day, index) => {
                const height = day.moodScore > 0 ? Math.max(day.moodScore * 16, 16) : 8
                const color = moodScoreToColor(day.moodScore)
                const emoji = day.moodScore >= 4 ? '😊' : day.moodScore >= 3 ? '😌' : day.moodScore >= 1 ? '😐' : '·'
                return (
                  <div key={day.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '14px' }}>{emoji}</span>
                    <div
                      style={{
                        width: '28px',
                        height: `${height}px`,
                        background: color,
                        borderRadius: '6px',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>周{DAY_LABELS[index]}</span>
                  </div>
                )
              })}
            </div>
          </motion.section>
        </>
      )}
    </div>
  )
}
