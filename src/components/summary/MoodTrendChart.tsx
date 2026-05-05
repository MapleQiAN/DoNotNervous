import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { format, parse } from 'date-fns'
import { useMoodChartDays } from '../../hooks/useSummary'

type ChartRange = 7 | 14 | 30

const rangeOptions: Array<{ value: ChartRange; label: string }> = [
  { value: 7, label: '7天' },
  { value: 14, label: '14天' },
  { value: 30, label: '30天' },
]

function scoreToEmoji(score: number): string {
  if (score >= 4) return '😊'
  if (score <= 2) return '😐'
  return '😌'
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { date: string; moodScore: number } }>
  label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  const emoji = scoreToEmoji(data.moodScore)
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '13px',
    }}>
      <p style={{ margin: 0, fontWeight: 600 }}>{data.date}</p>
      <p style={{ margin: '4px 0 0' }}>
        {emoji} 心情指数: {data.moodScore > 0 ? data.moodScore : '无数据'}
      </p>
    </div>
  )
}

export function MoodTrendChart() {
  const [range, setRange] = useState<ChartRange>(7)
  const rawData = useMoodChartDays(range)

  const chartData = useMemo(
    () => rawData.map(item => ({
      ...item,
      displayDate: format(parse(item.date, 'yyyy-MM-dd', new Date()), 'M/d'),
      score: item.moodScore,
    })),
    [rawData],
  )

  const hasData = chartData.some(item => item.moodScore > 0)

  return (
    <motion.div
      className="content-card"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="section-title-row">
        <h2>心情趋势</h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          {rangeOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`small-select ${range === opt.value ? 'is-active' : ''}`}
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12 }}
              stroke="var(--color-muted)"
            />
            <YAxis
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12 }}
              stroke="var(--color-muted)"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#4ade80"
              fill="url(#moodGradient)"
              strokeWidth={2}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ color: 'var(--color-muted)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
          还没有足够的心情数据来展示趋势
        </p>
      )}
    </motion.div>
  )
}
