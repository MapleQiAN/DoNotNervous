import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, maxLength = 1000, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-semibold text-text-primary mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          className={cn(
            'w-full bg-cream-50 border border-border rounded-lg px-4 py-2 text-text-primary text-base',
            'focus:outline-none focus:ring-2 focus:ring-lavender-500',
            'placeholder:text-text-secondary min-h-[80px] resize-y',
            error && 'border-coral-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-coral-500 mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
