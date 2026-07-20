import type { CostCard } from '@/types'

export const costCards: CostCard[] = [
  {
    title: 'Ingestion Cost per 1k Pages',
    amount: '$0.42',
    trend: { label: '−12% vs last month', tone: 'success' },
    items: [
      { label: 'Embedding Generation', value: '$0.28' },
      { label: 'Tokenization & Pre-proc', value: '$0.09' },
      { label: 'Vector DB Upsert', value: '$0.05' },
    ],
  },
  {
    title: 'Avg Query Cost per Call',
    amount: '$0.003',
    trend: { label: 'Stable', tone: 'info' },
    items: [
      { label: 'Query Embedding', value: '$0.0008' },
      { label: 'Search Retrieval', value: '$0.0012' },
      { label: 'Reranking & Metadata', value: '$0.0010' },
    ],
  },
]
