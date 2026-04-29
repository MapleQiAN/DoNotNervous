import { useRef, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { X } from 'lucide-react'
import { useRecentTransactions } from '../../hooks/usePoints'
import { useUIStore } from '../../stores/uiStore'

export function TransactionPopover() {
  const isOpen = useUIStore((s) => s.isPointsPopoverOpen)
  const setPointsPopoverOpen = useUIStore((s) => s.setPointsPopoverOpen)
  const transactions = useRecentTransactions(10)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPointsPopoverOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, setPointsPopoverOpen])

  if (!isOpen) return null

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-border z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Recent Points</h3>
        <button
          type="button"
          onClick={() => setPointsPopoverOpen(false)}
          className="text-text-secondary hover:text-text-primary cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-secondary text-center">
            Complete a task to start earning points!
          </p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-cream-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{tx.reason}</p>
                <p className="text-xs text-text-secondary">
                  {formatDistanceToNow(tx.createdAt, { addSuffix: true })}
                </p>
              </div>
              <span className="text-sm font-semibold text-amber-600 ml-2">
                +{tx.amount}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
