import { exportDB, importInto, peakImportFile } from 'dexie-export-import'
import { db } from '../db'

export async function exportData(): Promise<void> {
  const blob = await exportDB(db, { prettyJson: true })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `donotnervous-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importData(file: File): Promise<void> {
  const meta = await peakImportFile(file)
  if (!meta?.data?.databaseName) {
    throw new Error('Invalid backup file')
  }
  await importInto(db, file, {
    acceptNameDiff: true,
    acceptVersionDiff: true,
    clearTablesBeforeImport: true,
    overwriteValues: true,
  })
}
