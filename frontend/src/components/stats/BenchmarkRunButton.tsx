import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { runBenchmark, getBenchmarkStatus } from '@/api/client'

interface BenchmarkRunButtonProps {
  onStart: (runId: string) => void
  onComplete: () => void
}

export function BenchmarkRunButton({ onStart, onComplete }: BenchmarkRunButtonProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollFailuresRef = useRef(0)

  const clearCompletedTimer = useCallback(() => {
    if (completedTimerRef.current) {
      clearTimeout(completedTimerRef.current)
      completedTimerRef.current = null
    }
  }, [])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startBenchmark = useCallback(async () => {
    clearCompletedTimer()
    stopPolling()

    setStatus('running')
    setProgress(0)
    setTotal(0)
    setMessage(null)
    pollFailuresRef.current = 0

    try {
      const { run_id } = await runBenchmark()
      onStart(run_id)

      pollRef.current = setInterval(async () => {
        try {
          const bStatus = await getBenchmarkStatus(run_id)
          pollFailuresRef.current = 0
          setProgress(bStatus.progress)
          setTotal(bStatus.total)

          if (bStatus.status === 'completed') {
            stopPolling()
            setStatus('completed')
            setMessage(bStatus.message)
            onComplete()
            completedTimerRef.current = setTimeout(() => {
              setStatus('idle')
              setMessage(null)
            }, 5000)
          } else if (bStatus.status === 'failed' || bStatus.status === 'cancelled') {
            stopPolling()
            setStatus('error')
            setMessage(bStatus.message || `Benchmark ${bStatus.status}`)
          }
        } catch (err) {
          pollFailuresRef.current += 1
          if (pollFailuresRef.current >= 3) {
            stopPolling()
            setStatus('error')
            if (err instanceof TypeError && err.message === 'Failed to fetch') {
              setMessage('Backend unreachable — check that the server is still running')
            } else {
              setMessage('Lost connection to benchmark runner after 3 retries')
            }
          }
        }
      }, 5000)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Failed to start benchmark')
    }
  }, [onStart, onComplete, stopPolling, clearCompletedTimer])

  useEffect(() => {
    return () => {
      stopPolling()
      clearCompletedTimer()
    }
  }, [stopPolling, clearCompletedTimer])

  if (status === 'completed') {
    const hasFailures = message && message.includes('failure')
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          disabled
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${hasFailures ? 'bg-amber-500' : 'bg-success'}`}
        >
          {hasFailures ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          Complete — {total}/{total} queries
        </button>
        {message && (
          <span className={`text-xs ${hasFailures ? 'text-amber-600' : 'text-neutral-500'}`}>
            {message}
          </span>
        )}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={startBenchmark}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <XCircle className="h-4 w-4" />
          Retry Benchmark
        </button>
        {message && (
          <span className="max-w-xs text-right text-xs text-red-600">{message}</span>
        )}
      </div>
    )
  }

  if (status === 'running') {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white opacity-80"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Running... (Q {progress}/{total || '?'})
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={startBenchmark}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
    >
      <Play className="h-4 w-4" />
      Run Benchmark
    </button>
  )
}
