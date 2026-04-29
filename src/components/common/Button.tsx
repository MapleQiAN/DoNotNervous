import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-lavender-500 text-white hover:brightness-110 active:scale-[0.98]',
  secondary:
    'bg-cream-100 text-text-primary hover:bg-cream-50 active:scale-[0.98]',
  destructive:
    'bg-coral-500 text-white hover:brightness-110 active:scale-[0.98]',
  ghost:
    'text-text-secondary hover:bg-cream-100',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'rounded-lg font-semibold transition-all min-h-[44px] cursor-pointer',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
