import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { runBenchmark, getBenchmarkStatus, ApiError } from '@/api/client'

interface BenchmarkRunButtonProps {
  onStart: (runId: string) => void
  onComplete: () => void
}

export function BenchmarkRunButton({ onStart, onComplete }: BenchmarkRunButtonProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    try {
      const { run_id } = await runBenchmark()
      onStart(run_id)

      pollRef.current = setInterval(async () => {
        try {
          const bStatus = await getBenchmarkStatus(run_id)
          setProgress(bStatus.progress)
          setTotal(bStatus.total)

          if (bStatus.status === 'completed') {
            stopPolling()
            setStatus('completed')
            onComplete()
            completedTimerRef.current = setTimeout(() => {
              setStatus('idle')
            }, 5000)
          } else if (bStatus.status === 'failed') {
            stopPolling()
            setStatus('error')
          }
        } catch {
          stopPolling()
          setStatus('error')
        }
      }, 3000)
    } catch (err) {
      setStatus('error')
      console.error(err instanceof ApiError ? err.message : 'Failed to start benchmark')
    }
  }, [onStart, onComplete, stopPolling, clearCompletedTimer])

  useEffect(() => {
    return () => {
      stopPolling()
      clearCompletedTimer()
    }
  }, [stopPolling, clearCompletedTimer])

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

  if (status === 'completed') {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white"
      >
        <CheckCircle2 className="h-4 w-4" />
        Complete — {total}/{total} queries
      </button>
    )
  }

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={startBenchmark}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        <XCircle className="h-4 w-4" />
        Retry Benchmark
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
