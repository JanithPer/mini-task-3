import { Database, RefreshCw } from 'lucide-react'
import { StatusDot } from '@/components/ui/StatusDot'

interface SystemStatusProps {
  status: 'Idle' | 'Indexing' | 'Error'
  lastIngested: string
  documentCount: number
  onRunIngestion: () => void
}

export function SystemStatus({ status, lastIngested, documentCount, onRunIngestion }: SystemStatusProps) {
  const tone = status === 'Idle' ? 'idle' : status === 'Indexing' ? 'busy' : 'error'

  return (
    <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-surface-border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-white p-2 text-neutral-700 shadow-card">
          <Database className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-neutral-900">System Status:</span>
            <span className="font-semibold text-success">{status}</span>
            <StatusDot tone={tone} className="ml-1" />
          </div>
          <p className="text-xs text-neutral-500">
            Last ingested: {lastIngested} ({documentCount.toLocaleString()} documents total)
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRunIngestion}
        className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-surface-border bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 sm:self-auto"
      >
        <RefreshCw className="h-4 w-4" />
        Run Ingestion
      </button>
    </div>
  )
}
