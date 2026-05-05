import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { generateId } from '../lib/id'
import { rewardCreateSchema, rewardEditSchema } from '../domain/reward'
import { refreshDailySummaryForToday } from './useSummary'
import type { Reward, Redemption } from '../domain/types'

export async function createReward(input: unknown): Promise<Reward> {
  const validated = rewardCreateSchema.parse(input)
  const reward: Reward = {
    id: generateId(),
    name: validated.name,
    description: validated.description,
    pointCost: validated.pointCost,
    active: true,
    createdAt: new Date(),
  }
  await db.rewards.add(reward)
  return reward
}

export async function updateReward(id: string, input: unknown): Promise<void> {
  const validated = rewardEditSchema.parse(input)
  await db.rewards.update(id, validated)
}

export async function deleteReward(id: string): Promise<void> {
  await db.rewards.delete(id)
}

export async function redeemReward(rewardId: string): Promise<Redemption> {
  const reward = await db.rewards.get(rewardId)
  if (!reward) {
    throw new Error(`Reward not found: ${rewardId}`)
  }

  const entries = await db.pointLedger.toArray()
  const balance = entries.reduce((sum, entry) => sum + entry.amount, 0)

  if (balance < reward.pointCost) {
    throw new Error(
      `Not enough points. Need ${reward.pointCost}, have ${balance}`
    )
  }

  const now = new Date()
  const redemption: Redemption = {
    id: generateId(),
    rewardId: reward.id,
    rewardName: reward.name,
    pointsSpent: reward.pointCost,
    createdAt: now,
  }

  await db.transaction('rw', [db.pointLedger, db.redemptions], async () => {
    await db.pointLedger.add({
      id: generateId(),
      amount: -reward.pointCost,
      type: 'reward_spent',
      reason: `Redeemed: ${reward.name}`,
      taskId: null,
      streakLength: 0,
      multiplier: 1,
      createdAt: now,
    })
    await db.redemptions.add(redemption)
  })

  // Eager refresh: update daily/weekly summary (D-02)
  refreshDailySummaryForToday().catch(() => { /* non-blocking */ })

  return redemption
}

export function useRewards(): Reward[] {
  return useLiveQuery(
    async () => {
      const all = await db.rewards.toArray()
      return all
        .filter((r) => r.active)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },
    [],
    []
  )
}

export function useAllRewards(): Reward[] {
  return useLiveQuery(
    async () => db.rewards.orderBy('createdAt').reverse().toArray(),
    [],
    []
  )
}

export function useRedemptions(): Redemption[] {
  return useLiveQuery(
    async () => db.redemptions.orderBy('createdAt').reverse().toArray(),
    [],
    []
  )
}
