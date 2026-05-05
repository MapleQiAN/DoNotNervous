import { Dexie, type EntityTable } from 'dexie'
import type { Task, PointLedgerEntry, StreakRecord, MoodEntry, Reward, Redemption, DailySummary, WeeklySummary } from '../domain/types'

class DoNotNervousDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  pointLedger!: EntityTable<PointLedgerEntry, 'id'>
  streakRecords!: EntityTable<StreakRecord, 'date'>
  moodEntries!: EntityTable<MoodEntry, 'id'>
  rewards!: EntityTable<Reward, 'id'>
  redemptions!: EntityTable<Redemption, 'id'>
  dailySummaries!: EntityTable<DailySummary, 'date'>
  weeklySummaries!: EntityTable<WeeklySummary, 'weekStart'>

  constructor() {
    super('DoNotNervousDB')
    this.version(1).stores({
      tasks: 'id, parentId, type, status, category, sortOrder, createdAt, completedAt'
    })
    this.version(2).stores({
      pointLedger: 'id, type, taskId, createdAt',
      streakRecords: 'date',
    })
    this.version(3).stores({
      moodEntries: 'id, emoji, taskId, createdAt',
      rewards: 'id, createdAt',
      redemptions: 'id, rewardId, createdAt',
    })
    this.version(4).stores({
      dailySummaries: 'date, computedAt',
      weeklySummaries: 'weekStart, weekEnd, computedAt',
    })
    this.version(5).stores({
      streakRecords: 'date',
    }).upgrade(tx => {
      return tx.table('streakRecords').toCollection().modify(record => {
        if (record.recoveredFrom === undefined) record.recoveredFrom = false
        if (record.recoveryTaskId === undefined) record.recoveryTaskId = null
      })
    })
  }
}

export const db = new DoNotNervousDB()
