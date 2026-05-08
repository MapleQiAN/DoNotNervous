import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

export function useTaskCount(): number {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: ['tasks', 'count'],
    queryFn: () =>
      api.get<{ data: Array<{ id: string }> }>('/tasks?status=active', token!).then((r) => r.data.length),
    enabled: !!token,
  }).data ?? 0
}
