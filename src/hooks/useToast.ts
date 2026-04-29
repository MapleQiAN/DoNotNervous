import { useState, useCallback, useRef } from 'react'

interface ToastState {
  message: string
  type: 'success' | 'error'
  visible: boolean
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    visible: false,
  })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setToast({ message, type, visible: true })
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
      timerRef.current = null
    }, 3000)
  }, [])

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setToast((prev) => ({ ...prev, visible: false }))
  }, [])

  return { toast, showToast, hideToast }
}
