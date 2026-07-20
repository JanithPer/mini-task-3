import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { SearchBar } from '@/components/search/SearchBar'
import { RetrievalStrategies } from '@/components/search/RetrievalStrategies'
import { ChunkingStrategyControl } from '@/components/search/ChunkingStrategy'
import { TopKControl } from '@/components/search/TopKControl'
import { ResultsHeader } from '@/components/search/ResultsHeader'
import { ResultCard } from '@/components/search/ResultCard'
import { SystemStatus } from '@/components/search/SystemStatus'
import { mockResults } from '@/data/mockResults'
import type { ChunkingStrategyId, StrategyId } from '@/types'

const strategyOptions = [
  { id: 'hybrid' as StrategyId, label: 'Hybrid Search' },
  { id: 'cohere-rerank' as StrategyId, label: 'Cohere Rerank' },
  { id: 'contextual' as StrategyId, label: 'Contextual Retrieval' },
]

const chunkingOptions = [
  { id: 'recursive' as ChunkingStrategyId, label: 'Recursive', description: 'Fixed width overlaps' },
  { id: 'semantic' as ChunkingStrategyId, label: 'Semantic', description: 'Embedding based split' },
]

export function SearchPage() {
  const [query, setQuery] = useState('attention mechanism in transformers')
  const [submittedQuery, setSubmittedQuery] = useState('attention mechanism in transformers')
  const [strategies, setStrategies] = useState<StrategyId[]>([
    'hybrid',
    'cohere-rerank',
    'contextual',
  ])
  const [chunking, setChunking] = useState<ChunkingStrategyId>('recursive')
  const [topK, setTopK] = useState(10)

  const results = useMemo(() => mockResults.slice(0, topK), [topK])

  const toggleStrategy = (id: StrategyId) => {
    setStrategies((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  return (
    <div className="space-y-8">
      <Card className="p-6 sm:p-8">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={() => setSubmittedQuery(query)}
        />
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <RetrievalStrategies
            options={strategyOptions}
            selected={strategies}
            onToggle={toggleStrategy}
          />
          <ChunkingStrategyControl
            options={chunkingOptions}
            selected={chunking}
            onSelect={setChunking}
          />
          <TopKControl value={topK} onChange={setTopK} />
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-surface-border pt-4 text-xs text-neutral-500">
          <span>Search completed in 0.45s</span>
          <span className="rounded-md border border-surface-border bg-white px-2 py-1 font-mono text-[11px] text-neutral-600">
            ⌘ K
          </span>
        </div>
      </Card>

      <section className="space-y-5">
        <ResultsHeader
          count={results.length}
          query={submittedQuery}
          onClear={() => {
            setQuery('')
            setSubmittedQuery('')
          }}
        />
        <div className="space-y-4">
          {results.map((result) => (
            <ResultCard
              key={result.id}
              rank={result.rank}
              title={result.title}
              relevance={result.relevance}
              snippet={result.snippet}
              arxivId={result.arxivId}
              chunking={result.chunking}
              contextualized={result.contextualized}
              isTopResult={result.rank === 1}
            />
          ))}
        </div>
      </section>

      <SystemStatus
        status="Idle"
        lastIngested="2 hours ago"
        documentCount={1429}
        onRunIngestion={() => undefined}
      />
    </div>
  )
}
