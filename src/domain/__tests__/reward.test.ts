import { describe, it, expect } from 'vitest'
import type { Reward, Redemption } from '../types'
import { rewardCreateSchema, rewardEditSchema } from '../reward'

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

describe('rewardCreateSchema', () => {
  it('accepts valid reward with all fields', () => {
    const result = rewardCreateSchema.parse({
      name: 'Coffee break',
      description: 'Take a 15 min break',
      pointCost: 25,
    })
    expect(result.name).toBe('Coffee break')
    expect(result.description).toBe('Take a 15 min break')
    expect(result.pointCost).toBe(25)
  })

  it('defaults description to empty string', () => {
    const result = rewardCreateSchema.parse({
      name: 'Movie night',
      pointCost: 100,
    })
    expect(result.description).toBe('')
  })

  it('accepts pointCost = 1 (minimum)', () => {
    const result = rewardCreateSchema.parse({
      name: 'Tiny reward',
      pointCost: 1,
    })
    expect(result.pointCost).toBe(1)
  })

  it('rejects pointCost = 0', () => {
    expect(() =>
      rewardCreateSchema.parse({
        name: 'Free reward',
        pointCost: 0,
      })
    ).toThrow()
  })

  it('rejects negative pointCost', () => {
    expect(() =>
      rewardCreateSchema.parse({
        name: 'Negative cost',
        pointCost: -5,
      })
    ).toThrow()
  })

  it('rejects empty name', () => {
    expect(() =>
      rewardCreateSchema.parse({
        name: '',
        pointCost: 10,
      })
    ).toThrow()
  })

  it('rejects name exceeding 100 characters', () => {
    expect(() =>
      rewardCreateSchema.parse({
        name: 'a'.repeat(101),
        pointCost: 10,
      })
    ).toThrow()
  })

  it('rejects description exceeding 500 characters', () => {
    expect(() =>
      rewardCreateSchema.parse({
        name: 'Test',
        description: 'a'.repeat(501),
        pointCost: 10,
      })
    ).toThrow()
  })

  it('rejects non-integer pointCost', () => {
    expect(() =>
      rewardCreateSchema.parse({
        name: 'Decimal cost',
        pointCost: 1.5,
      })
    ).toThrow()
  })
})

describe('rewardEditSchema', () => {
  it('accepts partial update with only name', () => {
    const result = rewardEditSchema.parse({ name: 'Updated name' })
    expect(result.name).toBe('Updated name')
    expect(result.description).toBeUndefined()
    expect(result.pointCost).toBeUndefined()
    expect(result.active).toBeUndefined()
  })

  it('accepts partial update with only active', () => {
    const result = rewardEditSchema.parse({ active: false })
    expect(result.active).toBe(false)
  })

  it('accepts partial update with pointCost', () => {
    const result = rewardEditSchema.parse({ pointCost: 50 })
    expect(result.pointCost).toBe(50)
  })

  it('rejects pointCost = 0 even in partial update', () => {
    expect(() => rewardEditSchema.parse({ pointCost: 0 })).toThrow()
  })

  it('rejects negative pointCost in partial update', () => {
    expect(() => rewardEditSchema.parse({ pointCost: -1 })).toThrow()
  })

  it('rejects empty name in partial update', () => {
    expect(() => rewardEditSchema.parse({ name: '' })).toThrow()
  })

  it('accepts empty object (all fields optional)', () => {
    const result = rewardEditSchema.parse({})
    expect(result.name).toBeUndefined()
    expect(result.pointCost).toBeUndefined()
  })
})
