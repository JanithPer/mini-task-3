export type ChunkStrategy = 'recursive' | 'semantic'

export interface SearchParams {
  query: string
  chunk_strategy: ChunkStrategy
  hybrid: boolean
  rerank: boolean
  contextual: boolean
  top_k: number
}

export interface SearchResult {
  rank: number
  chunk_id: string
  content: string
  contextualized_content: string | null
  score: number
  document_title: string
  arxiv_id: string
  chunk_strategy: ChunkStrategy
}

export interface SearchResponse {
  results: SearchResult[]
  elapsed_ms: number
  query: string
  params_applied: SearchParams
}

export interface CostBreakdown {
  embedding: number
  context_gen: number
  query_rewrite: number
  rerank: number
  total: number
}

export interface StatsData {
  total_documents: number
  total_chunks: number
  last_ingested_at: string | null
  ingestion_cost_per_1k: CostBreakdown
  avg_query_cost: CostBreakdown
}

export interface CostDetailRow {
  component: string
  tokens_in: number | null
  tokens_out: number | null
  cost: number
}

export interface BenchmarkResult {
  strategy: string
  recall_5: number
  recall_10: number
  mrr: number
  avg_query_time_ms: number
  avg_cost: number
}

export interface BenchmarkResponse {
  results: BenchmarkResult[]
  run_at: string
}

export interface IngestionStatus {
  task_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  total: number
  message: string
  started_at: string | null
  finished_at: string | null
}

export interface BenchmarkStatus {
  run_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  total: number
  message: string
}

export interface SearchParamsState {
  chunk_strategy: ChunkStrategy
  hybrid: boolean
  rerank: boolean
  contextual: boolean
  top_k: number
}

export type StrategyId = 'hybrid' | 'rerank' | 'contextual'

export interface Strategy {
  id: StrategyId
  label: string
}

export interface ChunkingStrategy {
  id: ChunkStrategy
  label: string
  description: string
}

export interface CostCard {
  title: string
  amount: string
  trend?: { label: string; tone: 'success' | 'info' | 'warning' }
  items: CostLineItem[]
}

export interface CostLineItem {
  label: string
  value: string
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
