import { Database, RefreshCw, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { StatusDot } from '@/components/ui/StatusDot'

type IngestionPhase = 'idle' | 'running' | 'completed' | 'error'

interface SystemStatusProps {
  status: IngestionPhase
  progress?: number
  total?: number
  errorMessage?: string
  lastIngested: string
  documentCount: number
  onRunIngestion: () => void
  onRetry: () => void
  disabled: boolean
}

export function SystemStatus({
  status,
  progress = 0,
  total = 0,
  errorMessage,
  lastIngested,
  documentCount,
  onRunIngestion,
  onRetry,
  disabled,
}: SystemStatusProps) {
  const statusConfig: Record<IngestionPhase, { label: string; tone: 'idle' | 'busy' | 'error'; color: string }> = {
    idle: { label: 'Idle', tone: 'idle', color: 'text-success' },
    running: { label: `Ingesting... (${progress} papers processed)`, tone: 'busy', color: 'text-amber-600' },
    completed: { label: 'Complete', tone: 'idle', color: 'text-success' },
    error: { label: `Ingestion failed: ${errorMessage || 'Unknown error'}`, tone: 'error', color: 'text-red-600' },
  }

  const cfg = statusConfig[status]

  return (
    <div className="sticky bottom-0 z-20 flex flex-col items-stretch gap-3 rounded-2xl border border-surface-border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-white p-2 text-neutral-700 shadow-card">
          {status === 'running' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === 'completed' ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : status === 'error' ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Database className="h-4 w-4" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-neutral-900">System Status:</span>
            <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
            <StatusDot tone={cfg.tone} className="ml-1" />
          </div>
          <p className="text-xs text-neutral-500">
            Last ingested: {lastIngested} ({documentCount.toLocaleString()} documents total)
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {status === 'error' && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 sm:self-auto"
          >
            Retry
          </button>
        )}
        {status === 'running' && total > 0 && (
          <div className="h-1.5 w-32 rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${total ? (progress / total) * 100 : 0}%` }}
            />
          </div>
        )}
        <button
          type="button"
          onClick={onRunIngestion}
          disabled={disabled || status === 'running'}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-surface-border bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed sm:self-auto"
        >
          {status === 'running' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {status === 'running' ? 'Ingesting...' : 'Run Ingestion'}
        </button>
      </div>
    </div>
  )
}
