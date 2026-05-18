import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { moodKeys } from '../lib/queryKeys'
import { useAuthStore } from '../stores/authStore'
import { moodCreateSchema, MOODS } from '../domain/mood'
import { summaryKeys } from '../lib/queryKeys'
import { queryClient } from '../lib/queryClient'
import type { MoodEntry } from '../domain/types'

function hydrateMoodEntry(entry: MoodEntry): MoodEntry {
  return {
    ...entry,
    createdAt: new Date(entry.createdAt),
  }
}

export function useMoodEntries(): MoodEntry[] {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: moodKeys.list(),
    queryFn: () =>
      api.get<{ data: MoodEntry[] }>('/mood', token!).then((r) => r.data.map(hydrateMoodEntry)),
    enabled: !!token,
  }).data ?? []
}

export function useMoodEntriesForTask(taskId: string): MoodEntry[] {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: moodKeys.forTask(taskId),
    queryFn: () =>
      api.get<{ data: MoodEntry[] }>(`/mood?taskId=${taskId}`, token!).then((r) => r.data.map(hydrateMoodEntry)),
    enabled: !!token && !!taskId,
  }).data ?? []
}

export function useMoodEntriesForDate(dayKey: string): MoodEntry[] {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: moodKeys.forDate(dayKey),
    queryFn: () =>
      api.get<{ data: MoodEntry[] }>(`/mood?date=${dayKey}`, token!).then((r) => r.data.map(hydrateMoodEntry)),
    enabled: !!token && !!dayKey,
  }).data ?? []
}

export function useCreateMoodEntry() {
  const token = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: unknown) => {
      const validated = moodCreateSchema.parse(input)
      const moodMeta = MOODS.find((m) => m.emoji === validated.emoji)
      const payload = {
        ...validated,
        label: moodMeta?.label ?? '',
      }
      return api.post<{ data: MoodEntry }>('/mood', payload, token!).then((r) => hydrateMoodEntry(r.data))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: moodKeys.all })
      qc.invalidateQueries({ queryKey: summaryKeys.daily(new Date().toISOString().slice(0, 10)) })
    },
  })
}

export async function createMoodEntry(input: unknown): Promise<MoodEntry> {
  const token = useAuthStore.getState().accessToken
  if (!token) throw new Error('Not authenticated')

  const validated = moodCreateSchema.parse(input)
  const moodMeta = MOODS.find((m) => m.emoji === validated.emoji)
  const payload = {
    ...validated,
    label: moodMeta?.label ?? '',
  }

  const result = await api.post<{ data: MoodEntry }>('/mood', payload, token)
  await queryClient.invalidateQueries({ queryKey: moodKeys.all })
  await queryClient.invalidateQueries({ queryKey: summaryKeys.daily(new Date().toISOString().slice(0, 10)) })
  return hydrateMoodEntry(result.data)
}
