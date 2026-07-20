import { cn } from '@/lib/cn'

interface StatusDotProps {
  tone?: 'idle' | 'busy' | 'error'
  label?: string
  className?: string
}

const toneClass: Record<NonNullable<StatusDotProps['tone']>, string> = {
  idle: 'bg-success',
  busy: 'bg-amber-500',
  error: 'bg-red-500',
}

export function StatusDot({ tone = 'idle', label, className }: StatusDotProps) {
  return (
    <span className={cn('relative inline-flex h-2.5 w-2.5', className)}>
      <span
        className={cn(
          'absolute inset-0 rounded-full opacity-60 animate-ping',
          toneClass[tone],
        )}
      />
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', toneClass[tone])} />
      {label && <span className="ml-2 text-xs text-neutral-600">{label}</span>}
    </span>
  )
}
