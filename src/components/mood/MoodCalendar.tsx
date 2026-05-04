import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ArrowRight, CheckSquare, Clock3, Edit3, Leaf, Plus, Smile, SunMedium, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import { useMoodEntries, createMoodEntry } from '../../hooks/useMoodEntries'
import { MOODS } from '../../domain/mood'
import { useUIStore } from '../../stores/uiStore'
import type { MoodEmoji } from '../../domain/types'

interface MoodCalendarProps {
  showToast: (message: string, type?: 'success' | 'error') => void
  activeView?: 'mood' | 'data'
}

const moodScore: Record<MoodEmoji, number> = {
  '😊': 4,
  '😌': 3,
  '😐': 2,
  '😔': 2,
  '😰': 1,
  '😡': 1,
  '🥳': 5,
  '💪': 4,
}

const fallbackTrend = [4, 3.3, 2, 3, 3.8, 4.6, 3]

export function MoodCalendar({ showToast, activeView = 'mood' }: MoodCalendarProps) {
  const [showStandalonePicker, setShowStandalonePicker] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState<MoodEmoji | null>(null)
  const [journal, setJournal] = useState('')
  const allMoods = useMoodEntries()
  const setCurrentPage = useUIStore((s) => s.setCurrentPage)

  const trend = useMemo(() => {
    if (allMoods.length === 0) return fallbackTrend
    const recent = allMoods.slice(-7)
    const values = recent.map((entry) => moodScore[entry.emoji])
    while (values.length < 7) values.unshift(fallbackTrend[values.length])
    return values.slice(-7)
  }, [allMoods])

  const path = trend.map((value, index) => {
    const x = 40 + index * 118
    const y = 170 - value * 28
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

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
          <button type="button" onClick={() => setCurrentPage('mood')} className={activeView === 'mood' ? 'is-active' : ''}>心情记录</button>
          <button type="button" onClick={() => setCurrentPage('data')} className={activeView === 'data' ? 'is-active' : ''}>数据复盘</button>
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
            <path d={`${path} L 748 178 L 40 178 Z`} className="chart-area" />
            <path d={path} className="chart-line" />
            {trend.map((value, index) => (
              <g key={index}>
                <circle cx={40 + index * 118} cy={170 - value * 28} r="13" className="chart-dot" />
                <text x={40 + index * 118} y={176 - value * 28} textAnchor="middle" fontSize="14">{value >= 4 ? '😊' : value <= 2 ? '😐' : '😌'}</text>
                <text x={40 + index * 118} y="186" textAnchor="middle" className="chart-date">{`5/${12 + index}`}</text>
              </g>
            ))}
          </svg>
        </section>

        <section className="stats-strip mood-stats">
          <Stat icon={<CheckSquare />} label="本周完成任务数" value="18 个" note="较上周 20%" />
          <Stat icon={<Wallet />} label="累计奖励金额" value="¥ 235" note="可用余额 ¥168" />
          <Stat icon={<Smile />} label="平均心情指数" value="3.6 / 5" note="较上周 0.4" />
          <Stat icon={<Clock3 />} label="专注时段" value="下午" note="14:00-16:00" />
        </section>

        <section className="content-card mood-records">
          <div className="section-title-row">
            <h2>心情与任务记录</h2>
            <button type="button" className="small-select">全部情绪</button>
          </div>
          {(allMoods.length > 0 ? allMoods.slice(-4).reverse() : fallbackRecords).map((entry, index) => {
            const isFallback = !('id' in entry)
            return (
              <div key={isFallback ? entry.text : entry.id} className="record-row">
                <span className="record-emoji">{isFallback ? entry.emoji : entry.emoji}</span>
                <span>{isFallback ? entry.date : format(entry.createdAt, 'M/d')}</span>
                <p>{isFallback ? entry.text : (entry.journal || '记录了今天的心情')}</p>
                <em>{['工作', '健康', '生活', '专注'][index % 4]}</em>
                <strong>完成任务 {3 - (index % 3)} 个</strong>
              </div>
            )
          })}
          <button type="button" className="text-link">查看更多记录 <ArrowRight size={16} /></button>
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
          <Insight icon={<Activity />} title="完成运动任务的日子，心情更稳定" text="本周运动 3 天，平均心情 4.3，高于整体平均 0.7" />
          <Insight icon={<SunMedium />} title="下午完成效率最高" text="14:00-16:00 完成任务 8 个，占本周 44%" />
          <Insight icon={<CheckSquare />} title="周末情绪整体更好" text="周六、周日平均心情 4.2，高于工作日平均 3.2" />
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

const fallbackRecords = [
  { emoji: '😊', date: '5/18 周日', text: '完成需求文档后感觉轻松多了 🎉' },
  { emoji: '😊', date: '5/17 周六', text: '今天健身后心情很好，整个人都轻盈了 🌿' },
  { emoji: '😌', date: '5/16 周五', text: '上午有点焦虑，下午专注后好多了' },
  { emoji: '😐', date: '5/15 周四', text: '有点累，睡前记录一下，明天会更好' },
] as const
