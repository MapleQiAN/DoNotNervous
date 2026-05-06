import { useEffect, useRef } from 'react'
import { db } from '../db'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

const SYNC_INTERVAL = 30_000

const TABLE_MAP: Record<string, string> = {
  tasks: 'tasks',
  pointLedger: 'pointLedger',
  streakRecords: 'streakRecords',
  moodEntries: 'moodEntries',
  rewards: 'rewards',
  redemptions: 'redemptions',
  dailySummaries: 'dailySummaries',
  weeklySummaries: 'weeklySummaries',
}

export function useSync() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!accessToken) return

    async function sync() {
      try {
        const lastSyncEntry = await db.lastSyncState.get('lastSyncTimestamp')
        const lastSyncTimestamp = lastSyncEntry?.value || '1970-01-01T00:00:00Z'

        const queue = await db.syncQueue.toArray()

        const changes: Record<string, unknown[]> = {}
        if (queue.length > 0) {
          for (const entry of queue) {
            if (!changes[entry.tableName]) changes[entry.tableName] = []
            changes[entry.tableName].push(entry.data)
          }
        }

        const result = await api.post<{ serverTimestamp: string; changes: Record<string, unknown[]> }>(
          '/sync',
          { lastSyncTimestamp, changes },
          accessToken,
        )

        if (queue.length > 0) {
          const queueIds = queue.map((e) => e.id)
          await db.syncQueue.bulkDelete(queueIds)
        }

        await mergeServerChanges(result.changes)
        await db.lastSyncState.put({ key: 'lastSyncTimestamp', value: result.serverTimestamp })
      } catch {
        // Silent — will retry next interval
      }
    }

    sync()
    intervalRef.current = setInterval(sync, SYNC_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [accessToken])
}

async function mergeServerChanges(changes: Record<string, unknown[]>) {
  for (const [tableName, records] of Object.entries(changes)) {
    const dexieTable = TABLE_MAP[tableName]
    if (!dexieTable || records.length === 0) continue

    // @ts-expect-error dynamic table access
    await (db[dexieTable] as any).bulkPut(records)
  }
}
