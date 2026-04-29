import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export function useTaskCount(): number {
  return useLiveQuery(
    () => db.tasks.where('status').equals('active').count(),
    [],
    0
  )
}
