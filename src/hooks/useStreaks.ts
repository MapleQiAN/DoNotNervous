import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { api } from '../lib/api'
import { streakKeys } from '../lib/queryKeys'
import { useAuthStore } from '../stores/authStore'
import { useMascotStore } from '../stores/mascotStore'
import { celebrateStreakMilestone } from '../lib/celebrate'

export function useCurrentStreak(): number {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: streakKeys.current(),
    queryFn: () =>
      api.get<{ data: { streakLength: number } }>('/streaks/current', token!).then((r) => r.data.streakLength),
    enabled: !!token,
  }).data ?? 0
}

export function useStreakFreezes(): number {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: streakKeys.freezes(),
    queryFn: async () => {
      const result = await api.get<{ data: Array<{ freezeCountRemaining: number }> }>('/streaks?limit=1', token!)
      if (!result.data || result.data.length === 0) return 2
      return result.data[0].freezeCountRemaining
    },
    enabled: !!token,
  }).data ?? 2
}

export function useEarnBackOpportunity(): { gapDay: string } | null {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: streakKeys.earnBack(),
    queryFn: async () => {
      // Earn-back detection is client-side logic from streak records
      // For now, return null — server doesn't have this endpoint
      // TODO: add server endpoint if needed
      return null
    },
    enabled: !!token,
  }).data ?? null
}

export type StreakDayState = 'active' | 'frozen' | 'recovered' | 'missed' | 'empty' | 'future'

export interface StreakCalendarDay {
  date: Date
  dayKey: string
  isCurrentMonth: boolean
  isToday: boolean
  state: StreakDayState
  taskCount: number
}

interface StreakRecord {
  date: string
  completedTaskIds: string[]
  freezeUsed: boolean
  freezeCountRemaining: number
  recoveredFrom?: boolean
}

export function useStreakCalendarMonth(year: number, month: number): StreakCalendarDay[] {
  const token = useAuthStore((s) => s.accessToken)
  const monthDate = new Date(year, month, 1)
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const startKey = format(calendarStart, 'yyyy-MM-dd')
  const endKey = format(calendarEnd, 'yyyy-MM-dd')

  const records = useQuery({
    queryKey: streakKeys.calendar(year, month),
    queryFn: () =>
      api.get<{ data: StreakRecord[] }>(`/streaks?from=${startKey}&to=${endKey}`, token!).then((r) => r.data),
    enabled: !!token,
  }).data

  if (!records) return []

  const recordMap = new Map(records.map((r) => [r.date, r]))
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const now = new Date()

  return days.map((date) => {
    const dayKey = format(date, 'yyyy-MM-dd')
    const record = recordMap.get(dayKey)
    const isFuture = date > now && !isToday(date)

    let state: StreakDayState = 'empty'
    let taskCount = 0

    if (isFuture) {
      state = 'future'
    } else if (record?.recoveredFrom) {
      state = 'recovered'
      taskCount = record.completedTaskIds.length
    } else if (record?.freezeUsed) {
      state = 'frozen'
    } else if (record && record.completedTaskIds.length > 0) {
      state = 'active'
      taskCount = record.completedTaskIds.length
    } else if (!isFuture && isSameMonth(date, monthDate)) {
      state = 'missed'
    }

    return {
      date,
      dayKey,
      isCurrentMonth: isSameMonth(date, monthDate),
      isToday: isToday(date),
      state,
      taskCount,
    }
  })
}

const STREAK_MILESTONES = [7, 14, 30]

export async function computeCurrentStreak(): Promise<number> {
  const token = useAuthStore.getState().accessToken
  if (!token) return 0
  const result = await api.get<{ data: { streakLength: number } }>('/streaks/current', token)
  return result.data.streakLength
}

export async function checkAndApplyFreezes(
  _showToast: (message: string) => void,
): Promise<void> {
  // Server handles streak freeze logic on task completion
}

export async function checkStreakMilestone(): Promise<boolean> {
  const token = useAuthStore.getState().accessToken
  if (!token) return false
  const result = await api.get<{ data: { streakLength: number } }>('/streaks/current', token)
  const streak = result.data.streakLength
  if (STREAK_MILESTONES.includes(streak)) {
    useMascotStore.getState().setAnimation('encourage')
    celebrateStreakMilestone()
    return true
  }
  return false
}
