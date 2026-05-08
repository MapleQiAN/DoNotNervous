import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { pointKeys } from '../lib/queryKeys'
import { useAuthStore } from '../stores/authStore'
import type { PointLedgerEntry } from '../domain/types'

export function usePointBalance(): number {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: pointKeys.balance(),
    queryFn: () =>
      api.get<{ data: { balance: number } }>('/points/balance', token!).then((r) => r.data.balance),
    enabled: !!token,
  }).data ?? 0
}

export function usePointLedgerForDate(dayKey: string): PointLedgerEntry[] {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: pointKeys.forDate(dayKey),
    queryFn: () =>
      api.get<{ data: PointLedgerEntry[] }>(`/points?date=${dayKey}`, token!).then((r) => r.data),
    enabled: !!token && !!dayKey,
  }).data ?? []
}

export function useRecentTransactions(limit = 10): PointLedgerEntry[] {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: pointKeys.transactions(limit),
    queryFn: () =>
      api.get<{ data: PointLedgerEntry[] }>(`/points?limit=${limit}`, token!).then((r) => r.data),
    enabled: !!token,
  }).data ?? []
}
