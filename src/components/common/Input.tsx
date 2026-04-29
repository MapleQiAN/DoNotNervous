import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-text-primary mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-cream-50 border border-border rounded-lg px-4 py-2 text-text-primary text-base',
            'focus:outline-none focus:ring-2 focus:ring-lavender-500',
            'placeholder:text-text-secondary min-h-[44px]',
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

Input.displayName = 'Input'
