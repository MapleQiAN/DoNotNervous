import { describe, it, expect } from 'vitest'
import {
  calculatePoints,
  calculateMultiplier,
  POINT_VALUES,
} from '../points'

describe('calculateMultiplier', () => {
  it('returns 1 for streak length 0', () => {
    expect(calculateMultiplier(0)).toBe(1)
  })

  it('returns 1 for streak length 6 (below first tier)', () => {
    expect(calculateMultiplier(6)).toBe(1)
  })

  it('returns 1.5 for streak length 7 (first tier)', () => {
    expect(calculateMultiplier(7)).toBe(1.5)
  })

  it('returns 1.5 for streak length 13 (still first tier)', () => {
    expect(calculateMultiplier(13)).toBe(1.5)
  })

  it('returns 2 for streak length 14 (second tier)', () => {
    expect(calculateMultiplier(14)).toBe(2)
  })

  it('returns 2 for streak length 29 (still second tier)', () => {
    expect(calculateMultiplier(29)).toBe(2)
  })

  it('returns 3 for streak length 30 (third tier)', () => {
    expect(calculateMultiplier(30)).toBe(3)
  })

  it('returns 3 for streak length 100 (no higher tier per D-06)', () => {
    expect(calculateMultiplier(100)).toBe(3)
  })

  it('returns 1 for negative input (defensive)', () => {
    expect(calculateMultiplier(-1)).toBe(1)
  })
})

describe('calculatePoints', () => {
  it('returns correct base for easy difficulty at 1x multiplier', () => {
    const result = calculatePoints('easy', 0)
    expect(result).toEqual({ base: 10, bonus: 0, multiplier: 1 })
  })

  it('returns correct base for medium difficulty at 1x multiplier', () => {
    const result = calculatePoints('medium', 0)
    expect(result).toEqual({ base: 25, bonus: 0, multiplier: 1 })
  })

  it('returns correct base for hard difficulty at 1x multiplier', () => {
    const result = calculatePoints('hard', 0)
    expect(result).toEqual({ base: 50, bonus: 0, multiplier: 1 })
  })

  it('calculates bonus with Math.round for easy at 1.5x', () => {
    // Math.round(10 * 0.5) = 5
    const result = calculatePoints('easy', 10)
    expect(result).toEqual({ base: 10, bonus: 5, multiplier: 1.5 })
  })

  it('calculates bonus with Math.round for medium at 1.5x', () => {
    // Math.round(25 * 0.5) = 12 (not 12.5)
    const result = calculatePoints('medium', 10)
    expect(result).toEqual({ base: 25, bonus: 12, multiplier: 1.5 })
  })

  it('calculates bonus with Math.round for medium at 2x', () => {
    // Math.round(25 * 1.0) = 25
    const result = calculatePoints('medium', 14)
    expect(result).toEqual({ base: 25, bonus: 25, multiplier: 2 })
  })

  it('calculates bonus with Math.round for hard at 1.5x', () => {
    // Math.round(50 * 0.5) = 25
    const result = calculatePoints('hard', 10)
    expect(result).toEqual({ base: 50, bonus: 25, multiplier: 1.5 })
  })

  it('calculates bonus with Math.round for hard at 3x', () => {
    // Math.round(50 * 2.0) = 100
    const result = calculatePoints('hard', 30)
    expect(result).toEqual({ base: 50, bonus: 100, multiplier: 3 })
  })
})

describe('POINT_VALUES', () => {
  it('easy is 10', () => {
    expect(POINT_VALUES.easy).toBe(10)
  })

  it('medium is 25', () => {
    expect(POINT_VALUES.medium).toBe(25)
  })

  it('hard is 50', () => {
    expect(POINT_VALUES.hard).toBe(50)
  })
})
