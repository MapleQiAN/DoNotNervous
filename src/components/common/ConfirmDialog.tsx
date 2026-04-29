import { Button } from './Button'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-text-primary/30 z-50 flex items-center justify-center">
      <div className="bg-cream-50 rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg border border-border">
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        <p className="text-base text-text-secondary mt-2">{message}</p>
        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
