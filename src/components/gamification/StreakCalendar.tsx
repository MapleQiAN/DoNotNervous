import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Flame, Snowflake, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import {
  useStreakCalendarMonth,
  useCurrentStreak,
  type StreakCalendarDay,
  type StreakDayState,
} from '../../hooks/useStreaks'

interface StreakCalendarProps {
  onClose?: () => void
}

const MONTH_NAMES = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
]

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

const STATE_STYLES: Record<StreakDayState, string> = {
  active: 'bg-orange-100 text-orange-700 border-orange-200',
  frozen: 'bg-blue-50 text-blue-500 border-blue-200',
  recovered: 'bg-amber-50 text-amber-700 border-amber-200',
  missed: 'bg-gray-50 text-gray-300 border-gray-100',
  future: 'bg-white/50 text-gray-200 border-gray-100',
  empty: 'bg-white/30 text-gray-200 border-transparent',
}

const STATE_ICONS: Partial<Record<StreakDayState, React.ReactNode>> = {
  active: <Flame size={8} className="text-orange-400" />,
  frozen: <Snowflake size={8} className="text-blue-300" />,
  recovered: <Sparkles size={8} className="text-amber-400" />,
}

export function StreakCalendar({ onClose }: StreakCalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const days = useStreakCalendarMonth(viewYear, viewMonth)
  const streakLength = useCurrentStreak()

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => y - 1)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => y + 1)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  const stats = useMemo(() => {
    const currentMonthDays = days.filter(d => d.isCurrentMonth)
    const active = currentMonthDays.filter(d => d.state === 'active').length
    const recovered = currentMonthDays.filter(d => d.state === 'recovered').length
    const frozen = currentMonthDays.filter(d => d.state === 'frozen').length
    const total = active + recovered + frozen
    const totalPast = currentMonthDays.filter(d => d.state !== 'future' && d.state !== 'empty').length

    return { active, recovered, frozen, total, totalPast }
  }, [days])

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={18} className="text-gray-500" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-1"
              aria-label="Close calendar"
            >
              <X size={18} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 px-3 py-2 rounded-lg bg-orange-50/50 border border-orange-100">
        <p className="text-sm text-orange-700">
          {stats.total} / {stats.totalPast} 天活跃！
          {streakLength > 0 && (
            <span className="ml-2 text-orange-500">🔥 当前连续 {streakLength} 天</span>
          )}
        </p>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map(label => (
          <div key={label} className="text-center text-xs text-gray-400 font-medium py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => (
          <CalendarCell key={day.dayKey} day={day} />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-200" /> 活跃</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-200" /> 冻结</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-50 border border-amber-200" /> 恢复</span>
      </div>
    </div>
  )
}

function CalendarCell({ day }: { day: StreakCalendarDay }) {
  const style = STATE_STYLES[day.state]
  const icon = STATE_ICONS[day.state]
  const dayNumber = format(day.date, 'd')

  return (
    <div
      className={`
        aspect-square rounded-lg border flex flex-col items-center justify-center gap-0.5
        text-xs relative
        ${style}
        ${day.isToday ? 'ring-2 ring-orange-300 ring-offset-1' : ''}
        ${!day.isCurrentMonth ? 'opacity-40' : ''}
      `}
      aria-label={`${day.dayKey}: ${day.state}`}
    >
      <span className="font-medium leading-none">{dayNumber}</span>
      {icon && <span className="leading-none">{icon}</span>}
      {day.taskCount > 0 && (
        <span className="text-[9px] leading-none opacity-60">{day.taskCount}</span>
      )}
    </div>
  )
}
