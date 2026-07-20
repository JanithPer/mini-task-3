import type {
  SearchParams,
  SearchResponse,
  StatsData,
  CostDetailRow,
  IngestionStatus,
  BenchmarkStatus,
  BenchmarkResponse,
} from '@/types'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const DEFAULT_TIMEOUT_MS = 30_000

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown) {
    const message = typeof body === 'object' && body !== null && 'detail' in body
      ? String((body as Record<string, unknown>).detail)
      : `Request failed with status ${status}`
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

interface RequestOptions {
  timeoutMs?: number
  signal?: AbortSignal
}

function buildSignal(opts?: RequestOptions): { signal?: AbortSignal; cleanup: () => void } {
  const timeout = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  if (opts?.signal && timeout) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeout)
    const onExternalAbort = () => controller.abort(opts.signal!.reason)
    opts.signal.addEventListener('abort', onExternalAbort, { once: true })
    return {
      signal: controller.signal,
      cleanup: () => {
        clearTimeout(timeoutId)
        opts.signal?.removeEventListener('abort', onExternalAbort)
      },
    }
  }
  if (timeout) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeout)
    return { signal: controller.signal, cleanup: () => clearTimeout(timeoutId) }
  }
  return { signal: opts?.signal, cleanup: () => {} }
}

async function request<T>(path: string, init?: RequestInit, opts?: RequestOptions): Promise<T> {
  const { signal, cleanup } = buildSignal(opts)
  try {
    const response = await fetch(`${BASE}${path}`, { ...init, signal, headers: { 'Content-Type': 'application/json', ...init?.headers } })
    if (!response.ok) {
      let body: unknown
      try { body = await response.json() } catch { body = await response.text() }
      throw new ApiError(response.status, body)
    }
    return (await response.json()) as T
  } finally {
    cleanup()
  }
}

export function searchDocuments(params: SearchParams, opts?: RequestOptions): Promise<SearchResponse> {
  return request<SearchResponse>('/api/search', {
    method: 'POST',
    body: JSON.stringify(params),
  }, opts)
}

export function getStats(opts?: RequestOptions): Promise<StatsData> {
  return request<StatsData>('/api/stats', { method: 'GET' }, opts)
}

export function getStatsDetail(opts?: RequestOptions): Promise<CostDetailRow[]> {
  return request<CostDetailRow[]>('/api/stats/detail', { method: 'GET' }, opts)
}

export function triggerIngestion(opts?: RequestOptions): Promise<{ task_id: string }> {
  return request<{ task_id: string }>('/api/ingest', { method: 'POST' }, opts)
}

export function getIngestionStatus(taskId: string, opts?: RequestOptions): Promise<IngestionStatus> {
  return request<IngestionStatus>(`/api/ingest/status/${taskId}`, { method: 'GET' }, opts)
}

export function runBenchmark(opts?: RequestOptions): Promise<{ run_id: string }> {
  return request<{ run_id: string }>('/api/benchmark', { method: 'POST' }, opts)
}

export function getBenchmarkStatus(runId: string, opts?: RequestOptions): Promise<BenchmarkStatus> {
  return request<BenchmarkStatus>(`/api/benchmark/status/${runId}`, { method: 'GET' }, opts)
}

export function getBenchmarkResults(opts?: RequestOptions): Promise<BenchmarkResponse> {
  return request<BenchmarkResponse>('/api/benchmark/results', { method: 'GET' }, opts)
}
