import { useState, useRef, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { SearchBar } from '@/components/search/SearchBar'
import { RetrievalStrategies } from '@/components/search/RetrievalStrategies'
import { ChunkingStrategyControl } from '@/components/search/ChunkingStrategy'
import { TopKControl } from '@/components/search/TopKControl'
import { ResultsList } from '@/components/search/ResultsList'
import { SystemStatus } from '@/components/search/SystemStatus'
import { searchDocuments, getStats, triggerIngestion, getIngestionStatus, ApiError } from '@/api/client'
import { useSearchParamsState } from '@/hooks/useSearchParams'
import type { SearchResult, StrategyId } from '@/types'

const strategyOptions = [
  { id: 'hybrid' as StrategyId, label: 'Hybrid Search' },
  { id: 'rerank' as StrategyId, label: 'Rerank' },
  { id: 'contextual' as StrategyId, label: 'Contextual Retrieval' },
]

const chunkingOptions = [
  { id: 'recursive' as const, label: 'Recursive', description: 'Fixed width overlaps' },
  { id: 'semantic' as const, label: 'Semantic', description: 'Embedding based split' },
]

export function SearchPage() {
  const { params, toggleStrategy, setChunkStrategy, setParam } = useSearchParamsState()

  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partialError, setPartialError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)

  const [ingestionStatus, setIngestionStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [ingestionProgress, setIngestionProgress] = useState(0)
  const [ingestionTotal, setIngestionTotal] = useState(0)
  const [ingestionError, setIngestionError] = useState('')
  const [lastIngested, setLastIngested] = useState('')
  const [documentCount, setDocumentCount] = useState(0)
  const [dbEmpty, setDbEmpty] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const ingestionPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(
    async (searchQuery: string, searchParams: typeof params) => {
      if (!searchQuery.trim()) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)
      setPartialError(null)

      try {
        const response = await searchDocuments(
          {
            query: searchQuery.trim(),
            chunk_strategy: searchParams.chunk_strategy,
            hybrid: searchParams.hybrid,
            rerank: searchParams.rerank,
            contextual: searchParams.contextual,
            top_k: searchParams.top_k,
          },
          { signal: controller.signal },
        )

        if (controller.signal.aborted) return

        setResults(response.results)
        setElapsedMs(response.elapsed_ms / 1000)
        setSubmittedQuery(searchQuery)
      } catch (err) {
        if (controller.signal.aborted) return
        if (err instanceof ApiError) {
          setError(err.message)
        } else if (err instanceof DOMException && err.name === 'AbortError') {
          return
        } else if (err instanceof DOMException && err.name === 'TimeoutError') {
          setError('Request timed out. Try a simpler query or check backend status.')
        } else {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
        setResults(null)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    },
    [],
  )

  const handleSubmit = useCallback(() => {
    if (!query.trim()) return
    doSearch(query, params)
  }, [query, params, doSearch])

  const handleClear = useCallback(() => {
    setQuery('')
    setSubmittedQuery('')
    setResults(null)
    setElapsedMs(null)
    setError(null)
    setPartialError(null)
  }, [])

  useEffect(() => {
    if (submittedQuery && results !== null) {
      const timer = setTimeout(() => {
        doSearch(submittedQuery, params)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [params.hybrid, params.rerank, params.contextual, params.chunk_strategy, params.top_k])

  useEffect(() => {
    getStats()
      .then((stats) => {
        setDocumentCount(stats.total_documents)
        setLastIngested(stats.last_ingested_at ? new Date(stats.last_ingested_at).toLocaleString() : 'Never')
        setDbEmpty(stats.total_documents === 0)
      })
      .catch(() => {})
  }, [])

  const clearCompletedTimer = () => {
    if (completedTimerRef.current) {
      clearTimeout(completedTimerRef.current)
      completedTimerRef.current = null
    }
  }

  const startIngestion = useCallback(async () => {
    clearCompletedTimer()
    setIngestionStatus('running')
    setIngestionError('')

    try {
      const { task_id } = await triggerIngestion()
      setIngestionProgress(0)

      if (ingestionPollRef.current) clearInterval(ingestionPollRef.current)
      ingestionPollRef.current = setInterval(async () => {
        try {
          const status = await getIngestionStatus(task_id)
          setIngestionProgress(status.progress)
          setIngestionTotal(status.total)

          if (status.status === 'completed') {
            if (ingestionPollRef.current) clearInterval(ingestionPollRef.current)
            setIngestionStatus('completed')

            completedTimerRef.current = setTimeout(() => {
              setIngestionStatus('idle')
              getStats()
                .then((stats) => {
                  setDocumentCount(stats.total_documents)
                  setLastIngested(stats.last_ingested_at ? new Date(stats.last_ingested_at).toLocaleString() : 'Never')
                  setDbEmpty(stats.total_documents === 0)
                })
                .catch(() => {})
            }, 10_000)
          } else if (status.status === 'failed') {
            if (ingestionPollRef.current) clearInterval(ingestionPollRef.current)
            setIngestionStatus('error')
            setIngestionError(status.message)
          }
        } catch {
          if (ingestionPollRef.current) clearInterval(ingestionPollRef.current)
          setIngestionStatus('error')
          setIngestionError('Failed to fetch ingestion status')
        }
      }, 3000)
    } catch (err) {
      setIngestionStatus('error')
      setIngestionError(err instanceof ApiError ? err.message : 'Failed to start ingestion')
    }
  }, [])

  const retryIngestion = useCallback(() => {
    startIngestion()
  }, [startIngestion])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (ingestionPollRef.current) clearInterval(ingestionPollRef.current)
      clearCompletedTimer()
    }
  }, [])

  const isSearchDisabled = dbEmpty
  const isIngestionDisabled = loading

  return (
    <div className="space-y-8">
      <Card className="p-6 sm:p-8">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          onClear={handleClear}
          disabled={isSearchDisabled}
          loading={loading}
        />

        {dbEmpty && (
          <p className="mt-3 text-sm text-amber-600">
            No papers ingested yet. Run the ingestion pipeline first.
          </p>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <RetrievalStrategies
            options={strategyOptions}
            selected={[params.hybrid && 'hybrid', params.rerank && 'rerank', params.contextual && 'contextual'].filter(Boolean) as StrategyId[]}
            onToggle={toggleStrategy}
          />
          <ChunkingStrategyControl
            options={chunkingOptions}
            selected={params.chunk_strategy}
            onSelect={setChunkStrategy}
          />
          <TopKControl
            value={params.top_k}
            onChange={(v) => setParam('top_k', v)}
          />
        </div>
        {elapsedMs !== null && (
          <div className="mt-6 flex items-center justify-between border-t border-surface-border pt-4 text-xs text-neutral-500">
            <span>Search completed in {elapsedMs.toFixed(2)}s</span>
            <span className="rounded-md border border-surface-border bg-white px-2 py-1 font-mono text-[11px] text-neutral-600">
              {params.hybrid ? 'Hybrid' : 'Vector'} &middot; {params.rerank ? 'Rerank' : 'No rerank'} &middot; {params.contextual ? 'Ctx' : 'No ctx'}
            </span>
          </div>
        )}
      </Card>

      <ResultsList
        results={results}
        loading={loading}
        error={error}
        partialError={partialError}
        query={submittedQuery}
        onRetry={handleSubmit}
        onClear={handleClear}
      />

      <SystemStatus
        status={ingestionStatus}
        progress={ingestionProgress}
        total={ingestionTotal}
        errorMessage={ingestionError}
        lastIngested={lastIngested}
        documentCount={documentCount}
        onRunIngestion={startIngestion}
        onRetry={retryIngestion}
        disabled={isIngestionDisabled}
      />
    </div>
  )
}
