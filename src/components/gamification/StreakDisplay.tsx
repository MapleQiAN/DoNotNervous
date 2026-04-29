import { Flame } from 'lucide-react'
import { useCurrentStreak } from '../../hooks/useStreaks'

export function StreakDisplay() {
  const streakLength = useCurrentStreak()

  if (streakLength === 0) return null

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100"
      aria-label={`${streakLength} day streak`}
    >
      <Flame size={18} className="text-orange-500" />
      <span className="text-sm font-semibold text-orange-700">{streakLength}</span>
    </div>
  )
}
