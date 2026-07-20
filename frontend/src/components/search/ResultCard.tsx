import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { SearchResult } from '@/types'

interface ResultCardProps {
  result: SearchResult
  rank: number
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…'
}

export function ResultCard({ result, rank }: ResultCardProps) {
  const [expanded, setExpanded] = useState(false)
  const preview = truncate(result.content, 200)
  const isTopResult = rank === 1

  return (
    <article className="rounded-2xl border border-surface-border bg-white p-6 shadow-card transition-shadow hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={
              isTopResult
                ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white'
                : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700'
            }
          >
            {rank}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-neutral-900">
                {result.document_title}
              </h3>
              <Badge tone="success">{result.score.toFixed(2)} Relevance</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Badge tone="neutral">{result.chunk_strategy}</Badge>
          {result.contextualized_content && (
            <Badge tone="info">
              <Sparkles className="h-3 w-3" /> contextualized
            </Badge>
          )}
        </div>
      </div>

      <div className={`mt-3 ${expanded ? '' : 'max-h-20 overflow-hidden'} pl-[52px]`}>
        <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-wrap">
          {expanded ? result.content : preview}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between pl-[52px]">
        <a
          href={`https://arxiv.org/abs/${result.arxiv_id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          arxiv:{result.arxiv_id}
          <ExternalLink className="h-3 w-3" />
        </a>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          {expanded ? 'Show less' : 'Show more'}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>
    </article>
  )
}
