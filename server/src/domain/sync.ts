import { eq, and, gt } from 'drizzle-orm'
import { db } from '../db/index.js'
import * as schema from '../db/schema.js'

type TableName =
  | 'tasks'
  | 'pointLedger'
  | 'streakRecords'
  | 'moodEntries'
  | 'rewards'
  | 'redemptions'
  | 'dailySummaries'
  | 'weeklySummaries'
  | 'companionProfiles'
  | 'cosmeticUnlocks'
  | 'reminderPreferences'
  | 'syncStates'

const SYNC_TABLES: TableName[] = [
  'tasks',
  'pointLedger',
  'streakRecords',
  'moodEntries',
  'rewards',
  'redemptions',
  'dailySummaries',
  'weeklySummaries',
  'companionProfiles',
  'cosmeticUnlocks',
  'reminderPreferences',
  'syncStates',
]

/**
 * Strip identity columns from a data object so they are not overwritten
 * during an upsert's UPDATE clause. Also converts ISO date strings back
 * into Date objects for timestamp columns.
 */
function sanitizeForUpdate(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data }
  delete result.id
  delete result.userId
  delete result.date
  delete result.weekStart
  delete result.deviceId

  for (const [key, val] of Object.entries(result)) {
    if (typeof val === 'string' && (key.endsWith('At') || key === 'computedAt')) {
      ;(result as Record<string, unknown>)[key] = new Date(val)
    }
  }

  return result
}

/**
 * Convert any ISO date strings in a row payload into Date objects so
 * Drizzle receives the correct types for timestamp columns.
 */
function prepareRow(row: Record<string, unknown>): Record<string, unknown> {
  const result = { ...row }

  for (const [key, val] of Object.entries(result)) {
    if (typeof val === 'string' && (key.endsWith('At') || key === 'computedAt')) {
      ;(result as Record<string, unknown>)[key] = new Date(val)
    }
  }

  return result
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Drizzle's .values() has strict per-table
   typing that cannot be satisfied by a generic Record<string,unknown>. Casting to any is the
   standard workaround for generic upsert patterns. */

export async function pushChanges(
  userId: string,
  changes: Record<string, unknown[]>,
): Promise<void> {
  for (const [tableName, records] of Object.entries(changes)) {
    if (!SYNC_TABLES.includes(tableName as TableName) || records.length === 0) continue

    for (const record of records) {
      const row = record as Record<string, unknown>
      const prepared = prepareRow(row)
      const data: Record<string, unknown> = { ...prepared, userId, updatedAt: new Date() }
      const updateSet: Record<string, unknown> = {
        ...sanitizeForUpdate(data),
        updatedAt: new Date(),
      }

      if (tableName === 'tasks') {
        await db
          .insert(schema.tasks)
          .values(data as any)
          .onConflictDoUpdate({
            target: schema.tasks.id,
            set: updateSet as any,
          })
      } else if (tableName === 'pointLedger') {
        await db
          .insert(schema.pointLedger)
          .values(data as any)
          .onConflictDoUpdate({
            target: schema.pointLedger.id,
            set: updateSet as any,
          })
      } else if (tableName === 'streakRecords') {
        await db
          .insert(schema.streakRecords)
          .values({ ...data, date: row.date as string } as any)
          .onConflictDoUpdate({
            target: [schema.streakRecords.userId, schema.streakRecords.date],
            set: updateSet as any,
          })
      } else if (tableName === 'moodEntries') {
        await db
          .insert(schema.moodEntries)
          .values(data as any)
          .onConflictDoUpdate({
            target: schema.moodEntries.id,
            set: updateSet as any,
          })
      } else if (tableName === 'rewards') {
        await db
          .insert(schema.rewards)
          .values(data as any)
          .onConflictDoUpdate({
            target: schema.rewards.id,
            set: updateSet as any,
          })
      } else if (tableName === 'redemptions') {
        await db
          .insert(schema.redemptions)
          .values(data as any)
          .onConflictDoUpdate({
            target: schema.redemptions.id,
            set: updateSet as any,
          })
      } else if (tableName === 'dailySummaries') {
        await db
          .insert(schema.dailySummaries)
          .values({ ...data, date: row.date as string } as any)
          .onConflictDoUpdate({
            target: [schema.dailySummaries.userId, schema.dailySummaries.date],
            set: updateSet as any,
          })
      } else if (tableName === 'weeklySummaries') {
        await db
          .insert(schema.weeklySummaries)
          .values({ ...data, weekStart: row.weekStart as string } as any)
          .onConflictDoUpdate({
            target: [schema.weeklySummaries.userId, schema.weeklySummaries.weekStart],
            set: updateSet as any,
          })
      } else if (tableName === 'companionProfiles') {
        await db
          .insert(schema.companionProfiles)
          .values(data as any)
          .onConflictDoUpdate({
            target: schema.companionProfiles.userId,
            set: updateSet as any,
          })
      } else if (tableName === 'cosmeticUnlocks') {
        await db
          .insert(schema.cosmeticUnlocks)
          .values(data as any)
          .onConflictDoUpdate({
            target: [schema.cosmeticUnlocks.userId, schema.cosmeticUnlocks.cosmeticId],
            set: updateSet as any,
          })
      } else if (tableName === 'reminderPreferences') {
        await db
          .insert(schema.reminderPreferences)
          .values(data as any)
          .onConflictDoUpdate({
            target: schema.reminderPreferences.userId,
            set: updateSet as any,
          })
      } else if (tableName === 'syncStates') {
        await db
          .insert(schema.syncStates)
          .values({ ...data, deviceId: row.deviceId ?? 'default' } as any)
          .onConflictDoUpdate({
            target: [schema.syncStates.userId, schema.syncStates.deviceId],
            set: updateSet as any,
          })
      }
    }
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export async function pullChanges(
  userId: string,
  since: string,
): Promise<Record<string, unknown[]>> {
  const result: Record<string, unknown[]> = {}
  const sinceDate = new Date(since)

  result.tasks = await db
    .select()
    .from(schema.tasks)
    .where(and(eq(schema.tasks.userId, userId), gt(schema.tasks.updatedAt, sinceDate)))

  result.pointLedger = await db
    .select()
    .from(schema.pointLedger)
    .where(
      and(eq(schema.pointLedger.userId, userId), gt(schema.pointLedger.updatedAt, sinceDate)),
    )

  result.streakRecords = await db
    .select()
    .from(schema.streakRecords)
    .where(
      and(
        eq(schema.streakRecords.userId, userId),
        gt(schema.streakRecords.updatedAt, sinceDate),
      ),
    )

  result.moodEntries = await db
    .select()
    .from(schema.moodEntries)
    .where(and(eq(schema.moodEntries.userId, userId), gt(schema.moodEntries.updatedAt, sinceDate)))

  result.rewards = await db
    .select()
    .from(schema.rewards)
    .where(and(eq(schema.rewards.userId, userId), gt(schema.rewards.updatedAt, sinceDate)))

  result.redemptions = await db
    .select()
    .from(schema.redemptions)
    .where(
      and(eq(schema.redemptions.userId, userId), gt(schema.redemptions.updatedAt, sinceDate)),
    )

  result.dailySummaries = await db
    .select()
    .from(schema.dailySummaries)
    .where(
      and(
        eq(schema.dailySummaries.userId, userId),
        gt(schema.dailySummaries.updatedAt, sinceDate),
      ),
    )

  result.weeklySummaries = await db
    .select()
    .from(schema.weeklySummaries)
    .where(
      and(
        eq(schema.weeklySummaries.userId, userId),
        gt(schema.weeklySummaries.updatedAt, sinceDate),
      ),
    )

  result.companionProfiles = await db
    .select()
    .from(schema.companionProfiles)
    .where(
      and(
        eq(schema.companionProfiles.userId, userId),
        gt(schema.companionProfiles.updatedAt, sinceDate),
      ),
    )

  result.cosmeticUnlocks = await db
    .select()
    .from(schema.cosmeticUnlocks)
    .where(
      and(eq(schema.cosmeticUnlocks.userId, userId), gt(schema.cosmeticUnlocks.updatedAt, sinceDate)),
    )

  result.reminderPreferences = await db
    .select()
    .from(schema.reminderPreferences)
    .where(
      and(
        eq(schema.reminderPreferences.userId, userId),
        gt(schema.reminderPreferences.updatedAt, sinceDate),
      ),
    )

  result.syncStates = await db
    .select()
    .from(schema.syncStates)
    .where(
      and(eq(schema.syncStates.userId, userId), gt(schema.syncStates.updatedAt, sinceDate)),
    )

  return result
}
