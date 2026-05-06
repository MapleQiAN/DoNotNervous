import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ArrowRight, CheckSquare, Clock3, Edit3, Leaf, Plus, Smile, SunMedium, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useMoodEntries, createMoodEntry } from '../../hooks/useMoodEntries'
import { usePointBalance } from '../../hooks/usePoints'
import { MOODS } from '../../domain/mood'
import { MOOD_SCORE } from '../../domain/summary'
import type { MoodEmoji } from '../../domain/types'

interface MoodCalendarProps {
  showToast: (message: string, type?: 'success' | 'error') => void
  activeView?: 'mood' | 'data'
}

export function MoodCalendar({ showToast, activeView = 'mood' }: MoodCalendarProps) {
  const [showStandalonePicker, setShowStandalonePicker] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState<MoodEmoji | null>(null)
  const [journal, setJournal] = useState('')
  const allMoods = useMoodEntries()
  const navigate = useNavigate()

  const trend = useMemo(() => {
    if (allMoods.length === 0) return []
    const recent = allMoods.slice(-7)
    return recent.map((entry) => MOOD_SCORE[entry.emoji])
  }, [allMoods])

  const recentEntries = useMemo(() => allMoods.slice(-7), [allMoods])

  const path = trend.length > 1
    ? trend.map((value, index) => {
        const step = 696 / (trend.length - 1)
        const x = 40 + index * step
        const y = 170 - value * 28
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      }).join(' ')
    : ''

  const recentWeekMoods = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return allMoods.filter(m => m.createdAt >= weekAgo)
  }, [allMoods])

  const avgMoodScore = recentWeekMoods.length > 0
    ? (recentWeekMoods.reduce((sum, m) => sum + MOOD_SCORE[m.emoji], 0) / recentWeekMoods.length).toFixed(1)
    : '--'

  const weekCompletedTasks = useLiveQuery(
    async () => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const tasks = await db.tasks.where('status').equals('completed').toArray()
      return tasks.filter(t => t.completedAt && t.completedAt >= weekAgo).length
    },
    [],
    0
  )

  const balance = usePointBalance()

  async function handleStandaloneSave() {
    if (!selectedEmoji) return
    try {
      await createMoodEntry({ emoji: selectedEmoji, journal, taskId: null })
      showToast('心情已记录')
    } catch {
      showToast('保存失败', 'error')
    }
    setSelectedEmoji(null)
    setJournal('')
    setShowStandalonePicker(false)
  }

  return (
    <div className="dashboard-grid mood-route">
      <section className="main-column">
        <div className="top-tabs">
          <button type="button" onClick={() => navigate('/mood')} className={activeView === 'mood' ? 'is-active' : ''}>心情记录</button>
          <button type="button" onClick={() => navigate('/data')} className={activeView === 'data' ? 'is-active' : ''}>数据复盘</button>
        </div>

        <section className="hero-panel mood-hero">
          <div className="hero-copy">
            <h1>看见自己的节奏，也看见自己的情绪 🌿</h1>
            <p>记录每一次波动，也发现让你变好的规律。</p>
          </div>
          <img className="hero-illustration tea-illustration" src="/illustrations/mood-hero.png" alt="" aria-hidden="true" />
        </section>

        <section className="content-card chart-card">
          <div className="section-title-row">
            <h2>本周心情趋势</h2>
            <button type="button" className="small-select">本周</button>
          </div>
          <div className="mood-legend">
            {['很糟', '低落', '平静', '愉快', '很棒'].map((label, index) => <span key={label}>{['😡','😔','😐','😊','🥳'][index]} {label}</span>)}
          </div>
          <svg className="trend-chart" viewBox="0 0 760 190" role="img" aria-label="本周心情趋势图">
            {[1, 2, 3, 4, 5].map((line) => (
              <line key={line} x1="34" x2="736" y1={178 - line * 28} y2={178 - line * 28} className="chart-grid" />
            ))}
            {trend.length === 0 ? (
              <text x="380" y="95" textAnchor="middle" fill="var(--color-text-tertiary, #9ca3af)" fontSize="14">暂无心情数据</text>
            ) : (
              <>
                {path && (
                  <>
                    <path d={`${path} L ${40 + (trend.length - 1) * (trend.length > 1 ? 696 / (trend.length - 1) : 0)} 178 L 40 178 Z`} className="chart-area" />
                    <path d={path} className="chart-line" />
                  </>
                )}
                {trend.map((value, index) => {
                  const step = trend.length > 1 ? 696 / (trend.length - 1) : 0
                  const x = 40 + index * step
                  return (
                    <g key={index}>
                      <circle cx={x} cy={170 - value * 28} r="13" className="chart-dot" />
                      <text x={x} y={176 - value * 28} textAnchor="middle" fontSize="14">{value >= 4 ? '😊' : value <= 2 ? '😐' : '😌'}</text>
                      <text x={x} y="186" textAnchor="middle" className="chart-date">
                        {recentEntries[index] ? format(recentEntries[index].createdAt, 'M/d') : ''}
                      </text>
                    </g>
                  )
                })}
              </>
            )}
          </svg>
        </section>

        <section className="stats-strip mood-stats">
          <Stat icon={<CheckSquare />} label="本周完成任务数" value={weekCompletedTasks > 0 ? `${weekCompletedTasks}` : '--'} note={weekCompletedTasks > 0 ? `本周共完成 ${weekCompletedTasks} 个任务` : '暂无数据'} />
          <Stat icon={<Wallet />} label="累计奖励金额" value={balance > 0 ? `¥${balance}` : '--'} note={balance > 0 ? `已获得 ${balance} 奖励金` : '暂无数据'} />
          <Stat icon={<Smile />} label="平均心情指数" value={recentWeekMoods.length > 0 ? `${avgMoodScore} / 5` : '--'} note={recentWeekMoods.length > 0 ? `共 ${recentWeekMoods.length} 条记录` : '暂无数据'} />
          <Stat icon={<Clock3 />} label="专注时段" value="--" note="暂无数据" />
        </section>

        <section className="content-card mood-records">
          <div className="section-title-row">
            <h2>心情与任务记录</h2>
            <button type="button" className="small-select">全部情绪</button>
          </div>
          {allMoods.length === 0 ? (
            <p className="empty-hint">暂无心情记录，点击右侧记录今日心情</p>
          ) : (
            allMoods.slice(-4).reverse().map((entry) => (
              <div key={entry.id} className="record-row">
                <span className="record-emoji">{entry.emoji}</span>
                <span>{format(entry.createdAt, 'M/d')}</span>
                <p>{entry.journal || '记录了今天的心情'}</p>
              </div>
            ))
          )}
          {allMoods.length > 0 && (
            <button type="button" className="text-link">查看更多记录 <ArrowRight size={16} /></button>
          )}
        </section>
      </section>

      <aside className="right-column">
        <section className="side-panel mood-write">
          <h2>写下今天的心情吧</h2>
          <p>记录情绪，梳理想法，让自己被看见。</p>
          <button type="button" onClick={() => setShowStandalonePicker(true)} className="primary-wide">
            记录今日心情 <Edit3 size={17} />
          </button>
        </section>

        <AnimatePresence>
          {showStandalonePicker && (
            <motion.section initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="side-panel form-panel">
              <div className="mood-picker-grid">
                {MOODS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={selectedEmoji === emoji ? 'is-active' : ''}
                    aria-label={label}
                  >
                    <span>{emoji}</span>
                    <em>{label}</em>
                  </button>
                ))}
              </div>
              <textarea value={journal} onChange={(e) => setJournal(e.target.value.slice(0, 200))} placeholder="想对自己说点什么..." rows={3} />
              <button type="button" disabled={!selectedEmoji} onClick={handleStandaloneSave} className="primary-wide">
                保存心情 <Plus size={17} />
              </button>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="side-panel insights">
          <h2>数据洞察 ✨</h2>
          {allMoods.length === 0 ? (
            <Insight icon={<Activity />} title="记录心情后，这里会出现个性化洞察" text="持续记录，发现你的情绪规律" />
          ) : (
            <>
              <Insight icon={<Activity />} title={`本周共记录 ${recentWeekMoods.length} 次心情`} text={recentWeekMoods.length > 0 ? `平均心情指数 ${avgMoodScore}` : '继续记录，发现你的情绪规律'} />
              <Insight icon={<SunMedium />} title="继续记录，解锁更多洞察" text="记录越多，洞察越准确" />
            </>
          )}
          <button type="button" className="text-link">查看完整复盘报告 <ArrowRight size={16} /></button>
        </section>

        <section className="quote-card">
          <Leaf size={34} />
          <div>
            <h3>小建议</h3>
            <p>你已经做得很棒了。继续关注让你充实的事，情绪会越来越稳。</p>
          </div>
        </section>
      </aside>
    </div>
  )
}

function Stat({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{note}</p>
      </div>
    </div>
  )
}

function Insight({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="insight-row">
      <div>{icon}</div>
      <p>{title}<span>{text}</span></p>
    </div>
  )
}
