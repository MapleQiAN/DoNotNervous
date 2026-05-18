import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { companionProfiles } from '../db/schema.js'

export const COMPANION_EXPERIENCE_BY_DIFFICULTY: Record<string, number> = {
  easy: 12,
  medium: 28,
  hard: 55,
}

export function companionLevelFromExperience(experience: number): {
  level: number
  progress: number
  nextLevelExperience: number
} {
  let level = 1
  let remaining = Math.max(0, experience)
  let threshold = 100

  while (remaining >= threshold) {
    remaining -= threshold
    level += 1
    threshold = level * 100
  }

  return {
    level,
    progress: remaining,
    nextLevelExperience: threshold,
  }
}

export function experienceForDifficulty(difficulty: string): number {
  return COMPANION_EXPERIENCE_BY_DIFFICULTY[difficulty] ?? COMPANION_EXPERIENCE_BY_DIFFICULTY.easy
}

export async function getOrCreateCompanionProfile(userId: string) {
  const [existing] = await db
    .select()
    .from(companionProfiles)
    .where(eq(companionProfiles.userId, userId))
    .limit(1)

  if (existing) return existing

  const now = new Date()
  const [profile] = await db
    .insert(companionProfiles)
    .values({
      userId,
      displayName: '圆圆',
      level: 1,
      experience: 0,
      energy: 80,
      mood: 'normal',
      activeCosmeticIds: [],
      updatedAt: now,
    })
    .returning()

  return profile
}

export async function awardCompanionExperience(
  userId: string,
  amount: number,
) {
  const profile = await getOrCreateCompanionProfile(userId)
  const nextExperience = Math.max(0, profile.experience + amount)
  const levelInfo = companionLevelFromExperience(nextExperience)
  const now = new Date()

  const [updated] = await db
    .update(companionProfiles)
    .set({
      experience: nextExperience,
      level: levelInfo.level,
      energy: Math.min(100, profile.energy + 5),
      mood: amount > 0 ? 'celebrating' : profile.mood,
      updatedAt: now,
    })
    .where(eq(companionProfiles.userId, userId))
    .returning()

  return updated
}
