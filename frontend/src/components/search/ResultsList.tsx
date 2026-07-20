import { X, AlertTriangle } from 'lucide-react'
import { SkeletonCard } from './SkeletonCard'
import { EmptyState } from './EmptyState'
import { ResultCard } from './ResultCard'
import type { SearchResult } from '@/types'

interface ResultsListProps {
  results: SearchResult[] | null
  loading: boolean
  error: string | null
  partialError: string | null
  query: string
  onRetry: () => void
  onClear: () => void
}

export function ResultsList({
  results,
  loading,
  error,
  partialError,
  query,
  onRetry,
  onClear,
}: ResultsListProps) {
  if (loading) {
    return (
      <section className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-700">
              Search failed: {error}.
            </span>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </section>
    )
  }

  if (results === null) return null

  if (results.length === 0) {
    return (
      <section>
        <EmptyState />
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">
            {results.length} results for{' '}
            <span className="text-accent italic">&ldquo;{query}&rdquo;</span>
          </h2>
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

      {partialError && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-amber-700">{partialError}</span>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, index) => (
          <ResultCard
            key={result.chunk_id}
            result={result}
            rank={index + 1}
          />
        ))}
      </div>
    </section>
  )
}
