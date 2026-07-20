import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

interface PillProps {
  selected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
  showCheck?: boolean
}

export function Pill({ selected, onClick, children, className, showCheck = true }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        selected
          ? 'bg-ink text-white hover:bg-neutral-800'
          : 'bg-white text-neutral-700 border border-surface-border hover:border-neutral-300',
        className,
      )}
      aria-pressed={selected}
    >
      {showCheck && (
        <Check className={cn('h-3.5 w-3.5', selected ? 'text-white' : 'text-neutral-500')} />
      )}
      {children}
    </button>
  )
}
