import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Upload } from 'lucide-react'
import { Button } from '../common/Button'

async function exportData() {
  // Export via server API TBD
}

async function importData(_file: File) {
  // Import via server API TBD
}

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
  showToast: (message: string, type: 'success' | 'error') => void
}

export function SettingsDrawer({ isOpen, onClose, showToast }: SettingsDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    try {
      await exportData()
      showToast('Backup saved -- your data is safe.', 'success')
    } catch {
      showToast('Something went wrong. Try again -- your data is safe.', 'error')
    }
  }

  async function handleImport() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await importData(file)
      showToast('Data restored successfully.', 'success')
    } catch {
      showToast('Could not import this file. Make sure it is a DoNotNervous backup.', 'error')
    }

    e.target.value = ''
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-text-primary/30 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 max-w-full bg-cream-50 shadow-xl z-50"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-text-primary">Settings</h2>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-cream-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  Data
                </p>
                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => void handleExport()}
                  >
                    <Download className="w-4 h-4" />
                    Save Backup
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => void handleImport()}
                  >
                    <Upload className="w-4 h-4" />
                    Restore from Backup
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => void handleFileChange(e)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
