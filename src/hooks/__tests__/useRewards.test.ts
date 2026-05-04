import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../db'
import {
  createReward,
  updateReward,
  deleteReward,
  redeemReward,
} from '../useRewards'

describe('createReward', () => {
  beforeEach(async () => {
    await db.rewards.clear()
  })

  it('persists a Reward with active=true for valid input', async () => {
    const reward = await createReward({
      name: 'Coffee treat',
      description: 'Buy yourself a coffee',
      pointCost: 50,
    })

    expect(reward.id).toBeDefined()
    expect(reward.name).toBe('Coffee treat')
    expect(reward.description).toBe('Buy yourself a coffee')
    expect(reward.pointCost).toBe(50)
    expect(reward.active).toBe(true)
    expect(reward.createdAt).toBeInstanceOf(Date)

    const stored = await db.rewards.get(reward.id)
    expect(stored).toBeDefined()
    expect(stored!.active).toBe(true)
  })

  it('throws for pointCost=0', async () => {
    await expect(
      createReward({ name: 'Freebie', description: '', pointCost: 0 })
    ).rejects.toThrow()
  })

  it('throws for empty name', async () => {
    await expect(
      createReward({ name: '', description: '', pointCost: 10 })
    ).rejects.toThrow()
  })
})

describe('updateReward', () => {
  beforeEach(async () => {
    await db.rewards.clear()
  })

  it('applies partial validated updates', async () => {
    const reward = await createReward({
      name: 'Old name',
      description: 'Old desc',
      pointCost: 30,
    })

    await updateReward(reward.id, { name: 'New name', pointCost: 40 })

    const updated = await db.rewards.get(reward.id)
    expect(updated!.name).toBe('New name')
    expect(updated!.pointCost).toBe(40)
    expect(updated!.description).toBe('Old desc')
  })
})

describe('deleteReward', () => {
  beforeEach(async () => {
    await db.rewards.clear()
  })

  it('removes reward from DB', async () => {
    const reward = await createReward({
      name: 'Temp',
      description: '',
      pointCost: 10,
    })

    await deleteReward(reward.id)

    const stored = await db.rewards.get(reward.id)
    expect(stored).toBeUndefined()
  })
})

describe('redeemReward', () => {
  beforeEach(async () => {
    await db.rewards.clear()
    await db.redemptions.clear()
    await db.pointLedger.clear()
  })

  it('writes reward_spent ledger entry and Redemption with sufficient points', async () => {
    // Seed points
    await db.pointLedger.add({
      id: 'ledger-1',
      amount: 100,
      type: 'task_complete',
      reason: 'Test points',
      taskId: null,
      streakLength: 0,
      multiplier: 1,
      createdAt: new Date(),
    })

    const reward = await createReward({
      name: 'Coffee',
      description: '',
      pointCost: 50,
    })

    const redemption = await redeemReward(reward.id)

    expect(redemption.rewardId).toBe(reward.id)
    expect(redemption.rewardName).toBe('Coffee')
    expect(redemption.pointsSpent).toBe(50)
    expect(redemption.createdAt).toBeInstanceOf(Date)

    // Verify ledger entry
    const spentEntries = await db.pointLedger
      .where('type')
      .equals('reward_spent')
      .toArray()
    expect(spentEntries).toHaveLength(1)
    expect(spentEntries[0].amount).toBe(-50)
    expect(spentEntries[0].reason).toBe('Redeemed: Coffee')

    // Verify redemption record
    const storedRedemption = await db.redemptions.get(redemption.id)
    expect(storedRedemption).toBeDefined()
    expect(storedRedemption!.pointsSpent).toBe(50)
  })

  it('throws "Not enough points" when balance insufficient', async () => {
    // No points seeded — balance = 0
    const reward = await createReward({
      name: 'Expensive',
      description: '',
      pointCost: 100,
    })

    await expect(redeemReward(reward.id)).rejects.toThrow(
      'Not enough points'
    )

    // No ledger or redemption should exist
    const spentEntries = await db.pointLedger
      .where('type')
      .equals('reward_spent')
      .toArray()
    expect(spentEntries).toHaveLength(0)

    const redemptions = await db.redemptions.toArray()
    expect(redemptions).toHaveLength(0)
  })

  it('throws "Reward not found" for non-existent reward', async () => {
    await expect(redeemReward('nonexistent-id')).rejects.toThrow(
      'Reward not found'
    )
  })
})
