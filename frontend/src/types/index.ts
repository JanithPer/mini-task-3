export type StrategyId = 'hybrid' | 'cohere-rerank' | 'contextual'

export type ChunkingStrategyId = 'recursive' | 'semantic'

export interface Strategy {
  id: StrategyId
  label: string
}

export interface ChunkingStrategy {
  id: ChunkingStrategyId
  label: string
  description: string
}

export interface SearchResult {
  id: string
  rank: number
  title: string
  relevance: number
  snippet: string
  arxivId: string
  chunking: ChunkingStrategyId
  contextualized: boolean
}

export interface CostLineItem {
  label: string
  value: string
}

export interface CostCard {
  title: string
  amount: string
  trend?: { label: string; tone: 'success' | 'info' | 'warning' }
  items: CostLineItem[]
}

export interface BenchmarkRow {
  strategy: string
  isWinner?: boolean
  recall5: number
  recall10: number
  mrr: number
  avgQueryMs: string
  avgCost: string
}

export interface ChartBar {
  label: string
  recall5: number
  recall10: number
  mrr: number
}
