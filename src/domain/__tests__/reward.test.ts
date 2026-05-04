import { describe, it, expect } from 'vitest'
import type { Reward, Redemption } from '../types'

// Type-level test helper: forces compile error if type doesn't match
function expectType<T>(_value: T): void {}

describe('Reward type', () => {
  it('compiles with pointCost = 1 (minimum valid)', () => {
    const reward: Reward = {
      id: 'test-id',
      name: 'Coffee break',
      description: 'Take a 15 min coffee break',
      pointCost: 1,
      active: true,
      createdAt: new Date(),
    }
    expectType<Reward>(reward)
    expect(reward.pointCost).toBe(1)
  })

  it('compiles with all required fields', () => {
    const reward: Reward = {
      id: 'test-id',
      name: 'Movie night',
      description: 'Watch a movie of your choice',
      pointCost: 100,
      active: true,
      createdAt: new Date(),
    }
    expect(reward.name).toBe('Movie night')
    expect(reward.active).toBe(true)
  })

  it('accepts active = false for deactivated rewards', () => {
    const reward: Reward = {
      id: 'test-id',
      name: 'Old reward',
      description: 'No longer available',
      pointCost: 50,
      active: false,
      createdAt: new Date(),
    }
    expect(reward.active).toBe(false)
  })
})

describe('Redemption type', () => {
  it('compiles with all required fields', () => {
    const redemption: Redemption = {
      id: 'test-id',
      rewardId: 'reward-123',
      rewardName: 'Coffee break',
      pointsSpent: 25,
      createdAt: new Date(),
    }
    expectType<Redemption>(redemption)
    expect(redemption.rewardId).toBe('reward-123')
    expect(redemption.rewardName).toBe('Coffee break')
    expect(redemption.pointsSpent).toBe(25)
  })

  it('snapshots reward name at redemption time', () => {
    const redemption: Redemption = {
      id: 'test-id',
      rewardId: 'reward-456',
      rewardName: 'Movie night',
      pointsSpent: 100,
      createdAt: new Date(),
    }
    expect(redemption.rewardName).toBe('Movie night')
  })
})
