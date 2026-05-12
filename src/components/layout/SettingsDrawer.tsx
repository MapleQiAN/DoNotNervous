import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Upload, LogOut, User } from 'lucide-react'
import { Button } from '../common/Button'
import { useAuthStore } from '../../stores/authStore'

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
  showToast: (message: string, type: 'success' | 'error') => void
}

export function SettingsDrawer({ isOpen, onClose, showToast }: SettingsDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  async function handleExport() {
    showToast('备份功能开发中，敬请期待', 'error')
  }

  async function handleImport() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.target.value = ''
    showToast('恢复功能开发中，敬请期待', 'error')
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
              <h2 className="text-xl font-semibold text-text-primary">设置</h2>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-cream-100 rounded-lg transition-colors cursor-pointer"
                aria-label="关闭设置"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  数据
                </p>
                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => void handleExport()}
                  >
                    <Download className="w-4 h-4" />
                    保存备份
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => void handleImport()}
                  >
                    <Upload className="w-4 h-4" />
                    恢复备份
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

              <div className="border-t border-border pt-6">
                <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  账户
                </p>
                {user && (
                  <div className="flex items-center gap-3 mb-4 px-1">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-sm text-text-primary truncate">{user.email}</span>
                  </div>
                )}
                <Button
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50"
                  onClick={() => { logout(); onClose() }}
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
