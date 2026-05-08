import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { summaryKeys } from '../lib/queryKeys'
import { useAuthStore } from '../stores/authStore'
import type { DailySummary, WeeklySummary } from '../domain/types'

export function useDailySummary(dayKey: string): DailySummary | null {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: summaryKeys.daily(dayKey),
    queryFn: () =>
      api.get<{ data: DailySummary }>(`/summaries/daily/${dayKey}`, token!).then((r) => r.data),
    enabled: !!token && !!dayKey,
  }).data ?? null
}

export function useWeeklySummary(weekStart: string): WeeklySummary | null {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: summaryKeys.weekly(weekStart),
    queryFn: () =>
      api.get<{ data: WeeklySummary }>(`/summaries/weekly/${weekStart}`, token!).then((r) => r.data),
    enabled: !!token && !!weekStart,
  }).data ?? null
}

export function useMoodChartDays(days: number): Array<{ date: string; moodScore: number }> {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: summaryKeys.moodChart(days),
    queryFn: async () => {
      const results: Array<{ date: string; moodScore: number }> = []
      const today = new Date()
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dayKey = d.toISOString().slice(0, 10)
        try {
          const summary = await api.get<{ data: DailySummary }>(`/summaries/daily/${dayKey}`, token!)
          results.push({ date: dayKey, moodScore: summary.data?.dominantMoodScore ?? 0 })
        } catch {
          results.push({ date: dayKey, moodScore: 0 })
        }
      }
      return results
    },
    enabled: !!token,
  }).data ?? []
}

// Refresh helpers — server handles compute-if-missing on GET
export async function refreshDailySummary(dayKey: string): Promise<void> {
  const token = useAuthStore.getState().accessToken
  if (!token) return
  await api.get(`/summaries/daily/${dayKey}`, token)
}

export async function refreshWeeklySummary(weekStartDate: string): Promise<void> {
  const token = useAuthStore.getState().accessToken
  if (!token) return
  await api.get(`/summaries/weekly/${weekStartDate}`, token)
}

export async function refreshDailySummaryForToday(): Promise<void> {
  const dayKey = new Date().toISOString().slice(0, 10)
  await refreshDailySummary(dayKey)
}
