import { useState } from 'react'
import { Flame, Sparkles } from 'lucide-react'
import { useCurrentStreak, useEarnBackOpportunity } from '../../hooks/useStreaks'

interface StreakDisplayProps {
  onCalendarOpen?: () => void
}

export function StreakDisplay({ onCalendarOpen }: StreakDisplayProps = {}) {
  const streakLength = useCurrentStreak()
  const opportunity = useEarnBackOpportunity()

  if (streakLength === 0 && !opportunity) return null

  return (
    <div className="flex items-center gap-1.5">
      {opportunity && (
        <button
          type="button"
          onClick={onCalendarOpen}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium animate-pulse"
          aria-label="Streak recovery available"
        >
          <Sparkles size={14} />
          <span>Streak can be recovered!</span>
        </button>
      )}

      {streakLength > 0 && (
        <button
          type="button"
          onClick={onCalendarOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
          aria-label={`${streakLength} day streak -- click to view calendar`}
        >
          <Flame size={18} className="text-orange-500" />
          <span className="text-sm font-semibold text-orange-700">{streakLength}</span>
        </button>
      )}
    </div>
  )
}
