import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, iconLeft, ...props }, ref) => {
    return (
      <div className={cn('relative flex items-center w-full', className)}>
        {iconLeft && <span className="absolute left-4 text-neutral-500">{iconLeft}</span>}
        <input
          ref={ref}
          className={cn(
            'h-12 w-full rounded-xl border border-surface-border bg-white text-sm text-neutral-900 placeholder:text-neutral-500',
            'focus:border-ink focus:outline-none focus:ring-0',
            iconLeft ? 'pl-11 pr-4' : 'px-4',
          )}
          {...props}
        />
      </div>
    )
  },
)
Input.displayName = 'Input'
