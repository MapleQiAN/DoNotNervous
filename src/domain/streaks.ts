export const STREAK_MILESTONES = [
  { days: 7, label: '1 week streak!' },
  { days: 14, label: '2 week streak!' },
  { days: 30, label: '1 month streak!' },
] as const

export function getStreakMilestone(
  streakLength: number,
): { milestone: number; label: string } | null {
  for (const m of STREAK_MILESTONES) {
    if (streakLength === m.days) {
      return { milestone: m.days, label: m.label }
    }
  }
  return null
}
