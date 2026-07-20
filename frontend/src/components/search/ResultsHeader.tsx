import { X } from 'lucide-react'

interface ResultsHeaderProps {
  count: number
  query: string
  onClear: () => void
}

export function ResultsHeader({ count, query, onClear }: ResultsHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">
          {count} results for{' '}
          <span className="text-accent italic">&ldquo;{query}&rdquo;</span>
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Showing highest relevance matches across indexed repository
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
      >
        <X className="h-3.5 w-3.5" />
        Clear results
      </button>
    </div>
  )
}
