import { SearchX } from 'lucide-react'

interface EmptyStateProps {
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  message = 'No results found. Try adjusting your query or toggles.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-neutral-100 p-4 text-neutral-400">
        <SearchX className="h-8 w-8" />
      </div>
      <p className="max-w-sm text-sm text-neutral-500">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
