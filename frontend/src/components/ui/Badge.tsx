import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'success' | 'info' | 'warning' | 'dark'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  children: ReactNode
}

const tones: Record<Tone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  success: 'bg-success-soft text-success border border-success/20',
  info: 'bg-info-soft text-info border border-info/20',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  dark: 'bg-ink text-white',
}

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
