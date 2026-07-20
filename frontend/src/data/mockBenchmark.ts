import type { BenchmarkRow, ChartBar } from '@/types'

export const benchmarkRows: BenchmarkRow[] = [
  {
    strategy: 'Rec+Hyb',
    isWinner: true,
    recall5: 0.82,
    recall10: 0.94,
    mrr: 0.88,
    avgQueryMs: '142ms',
    avgCost: '$0.0032',
  },
  {
    strategy: 'Semantic v2',
    recall5: 0.75,
    recall10: 0.85,
    mrr: 0.78,
    avgQueryMs: '115ms',
    avgCost: '$0.0028',
  },
  {
    strategy: 'Rec+Vec',
    recall5: 0.65,
    recall10: 0.72,
    mrr: 0.58,
    avgQueryMs: '98ms',
    avgCost: '$0.0018',
  },
  {
    strategy: 'Keyword Only',
    recall5: 0.55,
    recall10: 0.6,
    mrr: 0.48,
    avgQueryMs: '45ms',
    avgCost: '$0.0004',
  },
]

export const chartData: ChartBar[] = [
  { label: 'Rec+Vec', recall5: 0.65, recall10: 0.72, mrr: 0.58 },
  { label: 'Rec+Hyb', recall5: 0.82, recall10: 0.94, mrr: 0.88 },
  { label: 'Keyword Only', recall5: 0.55, recall10: 0.6, mrr: 0.48 },
  { label: 'Semantic v2', recall5: 0.75, recall10: 0.85, mrr: 0.78 },
]
