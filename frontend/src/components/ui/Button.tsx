import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'pill'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-neutral-800',
  secondary: 'bg-white text-neutral-900 border border-surface-border hover:bg-neutral-50',
  ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100',
  pill: 'bg-ink text-white hover:bg-neutral-800',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', iconLeft, iconRight, children, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {iconLeft}
        {children}
        {iconRight}
      </button>
    )
  },
)
Button.displayName = 'Button'
