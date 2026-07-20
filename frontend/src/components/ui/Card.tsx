import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-surface-border bg-white shadow-card',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface SectionProps {
  title?: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
  children: ReactNode
}

export function Section({ title, description, action, icon, className, children }: SectionProps) {
  return (
    <section className={cn('mt-10', className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-neutral-700">{icon}</span>}
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        </div>
        {action}
      </div>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
