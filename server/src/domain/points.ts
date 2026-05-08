export const POINT_VALUES: Record<string, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
}

export const STREAK_TIERS = [
  { minDays: 30, multiplier: 3 },
  { minDays: 14, multiplier: 2 },
  { minDays: 7, multiplier: 1.5 },
  { minDays: 0, multiplier: 1 },
] as const

export function calculateMultiplier(streakLength: number): number {
  if (streakLength < 0) return 1
  for (const tier of STREAK_TIERS) {
    if (streakLength >= tier.minDays) return tier.multiplier
  }
  return 1
}

export function calculatePoints(
  difficulty: string,
  streakLength: number,
): { base: number; bonus: number; multiplier: number } {
  const base = POINT_VALUES[difficulty] ?? 10
  const multiplier = calculateMultiplier(streakLength)
  const bonus = Math.round(base * (multiplier - 1))
  return { base, bonus, multiplier }
}
