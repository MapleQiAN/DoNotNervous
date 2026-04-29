import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportData, importData } from '../useExportImport'

vi.mock('dexie-export-import', () => ({
  exportDB: vi.fn(),
  importInto: vi.fn(),
  peakImportFile: vi.fn(),
}))

import { exportDB, importInto, peakImportFile } from 'dexie-export-import'

describe('useExportImport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportData', () => {
    it('creates a downloadable blob and triggers download', async () => {
      const mockBlob = new Blob(['{"data": "test"}'], { type: 'application/json' })
      vi.mocked(exportDB).mockResolvedValue(mockBlob)

      const createObjectURL = vi.fn(() => 'blob:test-url')
      const revokeObjectURL = vi.fn()
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      }

      vi.stubGlobal('URL', {
        createObjectURL,
        revokeObjectURL,
      })

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLAnchorElement)
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('a'))
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.createElement('a'))

      await exportData()

      expect(exportDB).toHaveBeenCalledOnce()
      expect(createObjectURL).toHaveBeenCalledWith(mockBlob)
      expect(mockAnchor.click).toHaveBeenCalledOnce()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url')
      expect(removeChildSpy).toHaveBeenCalled()

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })
  })

  describe('importData', () => {
    it('calls importInto with correct options for valid file', async () => {
      const file = new File(['{"data": "test"}'], 'backup.json', { type: 'application/json' })
      vi.mocked(peakImportFile).mockResolvedValue({
        data: { databaseName: 'DoNotNervousDB', tables: [] },
      } as never)
      vi.mocked(importInto).mockResolvedValue(undefined as never)

      await importData(file)

      expect(peakImportFile).toHaveBeenCalledWith(file)
      expect(importInto).toHaveBeenCalledWith(
        expect.anything(),
        file,
        expect.objectContaining({
          acceptNameDiff: true,
          acceptVersionDiff: true,
          clearTablesBeforeImport: true,
          overwriteValues: true,
        })
      )
    })

    it('throws for invalid file without databaseName', async () => {
      const file = new File(['invalid'], 'bad.json', { type: 'application/json' })
      vi.mocked(peakImportFile).mockResolvedValue(null as never)

      await expect(importData(file)).rejects.toThrow('Invalid backup file')
    })

    it('throws for file with empty metadata', async () => {
      const file = new File(['{}'], 'empty.json', { type: 'application/json' })
      vi.mocked(peakImportFile).mockResolvedValue({ data: {} } as never)

      await expect(importData(file)).rejects.toThrow('Invalid backup file')
    })
  })
})
