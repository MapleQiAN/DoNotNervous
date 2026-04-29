import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../lib/cn'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  visible: boolean
}

export function Toast({ message, type = 'success', visible }: ToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 text-white text-sm font-semibold shadow-lg',
            type === 'success' && 'bg-sage-500',
            type === 'error' && 'bg-coral-500'
          )}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
