import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { taskKeys, pointKeys, streakKeys } from '../lib/queryKeys'
import { useAuthStore } from '../stores/authStore'
import { useMascotStore } from '../stores/mascotStore'
import { celebrateTaskComplete } from '../lib/celebrate'
import { checkStreakMilestone } from './useStreaks'
import { taskCreateSchema } from '../domain/task'
import { summaryKeys } from '../lib/queryKeys'
import type { Task } from '../domain/types'

function getToken(): string {
  const token = useAuthStore.getState().accessToken
  if (!token) throw new Error('Not authenticated')
  return token
}

export function useCreateTask() {
  const token = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: unknown) => {
      const validated = taskCreateSchema.parse(input)
      return api.post<{ data: Task }>('/tasks', validated, token!).then((r) => r.data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

export function useCompleteTask() {
  const token = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ data: { task: Task; points: { base: number; bonus: number; multiplier: number }; streakLength: number } }>(`/tasks/${id}/complete`, {}, token!).then((r) => r.data),
    onSuccess: (_data, _taskId) => {
      qc.invalidateQueries({ queryKey: taskKeys.all })
      qc.invalidateQueries({ queryKey: pointKeys.all })
      qc.invalidateQueries({ queryKey: streakKeys.all })
      const todayKey = new Date().toISOString().slice(0, 10)
      qc.invalidateQueries({ queryKey: summaryKeys.daily(todayKey) })

      // Mascot celebration
      useMascotStore.getState().setAnimation('celebrate')
      celebrateTaskComplete()
      checkStreakMilestone().catch(() => {})
    },
  })
}

export function useUncompleteTask() {
  const token = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ data: Task }>(`/tasks/${id}/uncomplete`, {}, token!).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

export function useDeleteTask() {
  const token = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.del(`/tasks/${id}`, token!),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

export function useUpdateTask() {
  const token = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const patch: Record<string, unknown> = { ...updates }
      if (updates.completedAt instanceof Date) patch.completedAt = updates.completedAt.toISOString()
      if (updates.archivedAt instanceof Date) patch.archivedAt = updates.archivedAt.toISOString()
      return api.patch(`/tasks/${id}`, patch, token!)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

// Legacy imperative functions (for non-hook contexts)
export async function createTask(input: unknown): Promise<Task> {
  const validated = taskCreateSchema.parse(input)
  const result = await api.post<{ data: Task }>('/tasks', validated, getToken())
  return result.data
}

export async function completeTask(id: string): Promise<Task> {
  const result = await api.post<{ data: { task: Task } }>(`/tasks/${id}/complete`, {}, getToken())

  // Mascot celebration
  useMascotStore.getState().setAnimation('celebrate')
  celebrateTaskComplete()
  checkStreakMilestone().catch(() => {})

  return result.data.task
}

export async function uncompleteTask(id: string): Promise<void> {
  await api.post(`/tasks/${id}/uncomplete`, {}, getToken())
}

export async function archiveTask(id: string): Promise<void> {
  await api.patch(`/tasks/${id}`, { status: 'archived', archivedAt: new Date().toISOString() }, getToken())
}

export async function unarchiveTask(id: string): Promise<void> {
  await api.patch(`/tasks/${id}`, { status: 'active', archivedAt: null }, getToken())
}

export async function deleteTask(id: string): Promise<void> {
  await api.del(`/tasks/${id}`, getToken())
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const patch: Record<string, unknown> = { ...updates }
  if (updates.completedAt instanceof Date) patch.completedAt = updates.completedAt.toISOString()
  if (updates.archivedAt instanceof Date) patch.archivedAt = updates.archivedAt.toISOString()
  await api.patch(`/tasks/${id}`, patch, getToken())
}
