import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { taskKeys } from '../lib/queryKeys'
import { useAuthStore } from '../stores/authStore'
import type { Task, MoodEntry } from '../domain/types'

function hydrateTask(task: Task): Task {
  return {
    ...task,
    createdAt: new Date(task.createdAt),
    completedAt: task.completedAt ? new Date(task.completedAt) : null,
    archivedAt: task.archivedAt ? new Date(task.archivedAt) : null,
  }
}

function hydrateMoodEntry(entry: MoodEntry): MoodEntry {
  return {
    ...entry,
    createdAt: new Date(entry.createdAt),
  }
}

export function useActiveTasks(): Task[] {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: taskKeys.list({ status: 'active' }),
    queryFn: () =>
      api.get<{ data: Task[] }>('/tasks?status=active', token!).then((r) => r.data.map(hydrateTask)),
    enabled: !!token,
  }).data ?? []
}

export function useCompletedTasksForDate(dayKey: string): Task[] {
  const token = useAuthStore((s) => s.accessToken)
  const start = `${dayKey}T00:00:00.000Z`
  const end = `${dayKey}T23:59:59.999Z`
  return useQuery({
    queryKey: taskKeys.list({ completedAfter: start, completedBefore: end }),
    queryFn: () =>
      api.get<{ data: Task[] }>(`/tasks?completedAfter=${start}&completedBefore=${end}`, token!).then((r) => r.data.map(hydrateTask)),
    enabled: !!token && !!dayKey,
  }).data ?? []
}

export function useCompletedTasksForWeek(weekStart: string, weekEnd: string): Task[] {
  const token = useAuthStore((s) => s.accessToken)
  const start = `${weekStart}T00:00:00.000Z`
  const end = `${weekEnd}T23:59:59.999Z`
  return useQuery({
    queryKey: taskKeys.list({ completedAfter: start, completedBefore: end }),
    queryFn: () =>
      api.get<{ data: Task[] }>(`/tasks?completedAfter=${start}&completedBefore=${end}`, token!).then((r) => r.data.map(hydrateTask)),
    enabled: !!token && !!weekStart,
  }).data ?? []
}

export function useSubtasks(parentId: string): Task[] {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: [...taskKeys.all, 'subtasks', parentId],
    queryFn: () =>
      api.get<{ data: Task[] }>('/tasks', token!).then((r) =>
        r.data.map(hydrateTask).filter((t) => (t as Task & { parentId: string | null }).parentId === parentId),
      ),
    enabled: !!token && !!parentId,
  }).data ?? []
}

export function useCategories(): string[] {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: [...taskKeys.all, 'categories'],
    queryFn: async () => {
      const result = await api.get<{ data: Task[] }>('/tasks?status=active', token!)
      const unique = [...new Set(result.data.map((t) => t.category).filter(Boolean))]
      return unique.sort()
    },
    enabled: !!token,
  }).data ?? []
}

export function useLatestMood(): MoodEntry | null {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: ['mood', 'latest'],
    queryFn: () =>
      api.get<{ data: MoodEntry | null }>('/mood/latest', token!).then((r) => r.data ? hydrateMoodEntry(r.data) : null),
    enabled: !!token,
  }).data ?? null
}
