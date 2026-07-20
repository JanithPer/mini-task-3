import { useState, useCallback } from 'react'
import type { SearchParamsState, ChunkStrategy } from '@/types'

const defaults: SearchParamsState = {
  chunk_strategy: 'recursive',
  hybrid: true,
  rerank: true,
  contextual: true,
  top_k: 10,
}

export function useSearchParamsState() {
  const [params, setParamsState] = useState<SearchParamsState>(defaults)

  const setParam = useCallback(<K extends keyof SearchParamsState>(key: K, value: SearchParamsState[K]) => {
    setParamsState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setParams = useCallback((next: Partial<SearchParamsState>) => {
    setParamsState((prev) => ({ ...prev, ...next }))
  }, [])

  const toggleStrategy = useCallback((key: 'hybrid' | 'rerank' | 'contextual') => {
    setParamsState((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const setChunkStrategy = useCallback((strategy: ChunkStrategy) => {
    setParamsState((prev) => ({ ...prev, chunk_strategy: strategy }))
  }, [])

  const reset = useCallback(() => {
    setParamsState(defaults)
  }, [])

  return { params, setParam, setParams, toggleStrategy, setChunkStrategy, reset }
}
