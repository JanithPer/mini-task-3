import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

interface OptionCardProps {
  selected: boolean
  onClick: () => void
  title: string
  description: string
  className?: string
  trailing?: ReactNode
}

export function OptionCard({
  selected,
  onClick,
  title,
  description,
  className,
  trailing,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'group relative w-full rounded-xl border bg-white p-4 text-left transition-colors',
        selected
          ? 'border-accent ring-1 ring-accent/40'
          : 'border-surface-border hover:border-neutral-300',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-neutral-900">{title}</div>
          <div className="mt-0.5 text-xs text-neutral-500">{description}</div>
        </div>
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full',
            selected ? 'bg-accent text-white' : 'border border-neutral-300 bg-white text-transparent',
          )}
        >
          <Check className="h-3 w-3" />
        </span>
      </div>
      {trailing && <div className="mt-3">{trailing}</div>}
    </button>
  )
}
