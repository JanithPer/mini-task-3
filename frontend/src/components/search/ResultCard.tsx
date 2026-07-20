import { ChevronDown, ExternalLink, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface ResultCardProps {
  rank: number
  title: string
  relevance: number
  snippet: string
  arxivId: string
  chunking: 'recursive' | 'semantic'
  contextualized: boolean
  isTopResult?: boolean
}

export function ResultCard({
  rank,
  title,
  relevance,
  snippet,
  arxivId,
  chunking,
  contextualized,
  isTopResult,
}: ResultCardProps) {
  return (
    <article className="rounded-2xl border border-surface-border bg-white p-6 shadow-card transition-shadow hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={
              isTopResult
                ? 'flex h-9 w-9 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white'
                : 'flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700'
            }
          >
            {rank}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
              <Badge tone="success">{relevance.toFixed(2)} Relevance</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{chunking}</Badge>
          {contextualized && (
            <Badge tone="info">
              <Sparkles className="h-3 w-3" /> [contextualized]
            </Badge>
          )}
        </div>
      </div>
      <p className="mt-3 pl-[52px] text-sm leading-relaxed text-neutral-600">{snippet}</p>
      <div className="mt-4 flex items-center justify-between pl-[52px]">
        <a
          href={`https://arxiv.org/abs/${arxivId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          arxiv:{arxivId}
          <ExternalLink className="h-3 w-3" />
        </a>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800"
        >
          Show more
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </article>
  )
}
