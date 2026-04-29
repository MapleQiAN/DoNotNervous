import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { PointLedgerEntry } from '../domain/types'

export function usePointBalance(): number {
  return useLiveQuery(
    async () => {
      const entries = await db.pointLedger.toArray()
      return entries.reduce((sum, entry) => sum + entry.amount, 0)
    },
    [],
    0
  )
}

export function useRecentTransactions(limit = 10): PointLedgerEntry[] {
  return useLiveQuery(
    async () =>
      db.pointLedger
        .orderBy('createdAt')
        .reverse()
        .limit(limit)
        .toArray(),
    [],
    []
  )
}
