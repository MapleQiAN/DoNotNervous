import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queryClient } from '../lib/queryClient'
import { rewardKeys, pointKeys } from '../lib/queryKeys'
import { useAuthStore } from '../stores/authStore'
import { rewardCreateSchema, rewardEditSchema } from '../domain/reward'
import type { Reward, Redemption } from '../domain/types'

function hydrateReward(reward: Reward): Reward {
  return {
    ...reward,
    createdAt: new Date(reward.createdAt),
  }
}

function hydrateRedemption(redemption: Redemption): Redemption {
  return {
    ...redemption,
    createdAt: new Date(redemption.createdAt),
  }
}

export function useRewards(): Reward[] {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: rewardKeys.active(),
    queryFn: async () => {
      const result = await api.get<{ data: Reward[] }>('/rewards', token!)
      return result.data.map(hydrateReward).filter((r) => r.active)
    },
    enabled: !!token,
  }).data ?? []
}

export function useAllRewards(): Reward[] {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: rewardKeys.allRewards(),
    queryFn: () =>
      api.get<{ data: Reward[] }>('/rewards', token!).then((r) => r.data.map(hydrateReward)),
    enabled: !!token,
  }).data ?? []
}

export function useRedemptions(): Redemption[] {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: rewardKeys.redemptions(),
    queryFn: () =>
      api.get<{ data: Redemption[] }>('/rewards/redemptions', token!).then((r) => r.data.map(hydrateRedemption)),
    enabled: !!token,
  }).data ?? []
}

export function useCreateReward() {
  const token = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: unknown) => {
      const validated = rewardCreateSchema.parse(input)
      return api.post<{ data: Reward }>('/rewards', validated, token!).then((r) => hydrateReward(r.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rewardKeys.all }),
  })
}

export function useRedeemReward() {
  const token = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (rewardId: string) =>
      api.post<{ data: Redemption }>(`/rewards/${rewardId}/redeem`, {}, token!).then((r) => hydrateRedemption(r.data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rewardKeys.all })
      qc.invalidateQueries({ queryKey: pointKeys.all })
    },
  })
}

export function useDeleteReward() {
  const token = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.del(`/rewards/${id}`, token!),
    onSuccess: () => qc.invalidateQueries({ queryKey: rewardKeys.all }),
  })
}

// Legacy imperative functions (for non-hook contexts)
export async function createReward(input: unknown): Promise<Reward> {
  const token = useAuthStore.getState().accessToken
  if (!token) throw new Error('Not authenticated')
  const validated = rewardCreateSchema.parse(input)
  const result = await api.post<{ data: Reward }>('/rewards', validated, token)
  await queryClient.invalidateQueries({ queryKey: rewardKeys.all })
  return hydrateReward(result.data)
}

export async function updateReward(id: string, input: unknown): Promise<void> {
  const token = useAuthStore.getState().accessToken
  if (!token) throw new Error('Not authenticated')
  const validated = rewardEditSchema.parse(input)
  await api.patch(`/rewards/${id}`, validated, token)
  await queryClient.invalidateQueries({ queryKey: rewardKeys.all })
}

export async function deleteReward(id: string): Promise<void> {
  const token = useAuthStore.getState().accessToken
  if (!token) throw new Error('Not authenticated')
  await api.del(`/rewards/${id}`, token)
  await queryClient.invalidateQueries({ queryKey: rewardKeys.all })
}

export async function redeemReward(rewardId: string): Promise<Redemption> {
  const token = useAuthStore.getState().accessToken
  if (!token) throw new Error('Not authenticated')
  const result = await api.post<{ data: Redemption }>(`/rewards/${rewardId}/redeem`, {}, token)
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: rewardKeys.all }),
    queryClient.invalidateQueries({ queryKey: pointKeys.all }),
  ])
  return hydrateRedemption(result.data)
}
