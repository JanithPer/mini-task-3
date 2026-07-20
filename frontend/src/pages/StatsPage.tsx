import { useState, useEffect, useCallback } from 'react'
import { Download, BarChart3, Banknote, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Card'
import { CostCardItem } from '@/components/stats/CostCard'
import { BenchmarkChart, BenchmarkLegend } from '@/components/stats/BenchmarkChart'
import { BenchmarkTable } from '@/components/stats/BenchmarkTable'
import { BenchmarkRunButton } from '@/components/stats/BenchmarkRunButton'
import {
  getStats,
  getStatsDetail,
  getBenchmarkResults,
  ApiError,
} from '@/api/client'
import { costCards as fallbackCostCards } from '@/data/mockCosts'
import { benchmarkRows as fallbackBenchmarkRows, chartData as fallbackChartData } from '@/data/mockBenchmark'
import type { StatsData, CostDetailRow, BenchmarkResult, CostCard, BenchmarkRow, ChartBar } from '@/types'

function formatNumber(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return String(n)
}

function mapStatsToCostCards(stats: StatsData): CostCard[] {
  return [
    {
      title: 'Ingestion Cost per 1k Pages',
      amount: `$${stats.ingestion_cost_per_1k.total.toFixed(2)}`,
      items: [
        { label: 'Embedding Generation', value: `$${stats.ingestion_cost_per_1k.embedding.toFixed(2)}` },
        { label: 'Context Generation', value: `$${stats.ingestion_cost_per_1k.context_gen.toFixed(2)}` },
        { label: 'Tokenization & Pre-proc', value: '—' },
      ],
    },
    {
      title: 'Avg Query Cost per Call',
      amount: `$${stats.avg_query_cost.total.toFixed(6)}`,
      trend: { label: 'Stable', tone: 'info' },
      items: [
        { label: 'Query Embedding', value: `$${stats.avg_query_cost.embedding.toFixed(6)}` },
        { label: 'Query Rewrite', value: `$${stats.avg_query_cost.query_rewrite.toFixed(6)}` },
        { label: 'Reranking & Metadata', value: `$${stats.avg_query_cost.rerank.toFixed(6)}` },
      ],
    },
  ]
}

function mapBenchmarkResults(results: BenchmarkResult[]): {
  rows: BenchmarkRow[]
  chartData: ChartBar[]
} {
  const withData = results.filter(
    (r) => r.recall_5 > 0 || r.recall_10 > 0 || r.mrr > 0,
  )
  if (withData.length === 0) return { rows: [], chartData: [] }

  let bestRecall10 = -1
  for (const r of withData) {
    if (r.recall_10 > bestRecall10) bestRecall10 = r.recall_10
  }

  const rows: BenchmarkRow[] = withData.map((r) => ({
    strategy: r.strategy,
    isWinner: r.recall_10 === bestRecall10,
    recall5: r.recall_5,
    recall10: r.recall_10,
    mrr: r.mrr,
    avgQueryMs: `${r.avg_query_time_ms}ms`,
    avgCost: `$${r.avg_cost.toFixed(6)}`,
  }))

  const chartData: ChartBar[] = withData.map((r) => ({
    label: r.strategy,
    recall5: r.recall_5,
    recall10: r.recall_10,
    mrr: r.mrr,
  }))

  return { rows, chartData }
}

export function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [costDetailRows, setCostDetailRows] = useState<CostDetailRow[]>([])
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsData, detailRows, benchmarkData] = await Promise.all([
        getStats(),
        getStatsDetail(),
        getBenchmarkResults(),
      ])
      setStats(statsData)
      setCostDetailRows(detailRows)
      setBenchmarkResults(benchmarkData.results)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load data. Make sure the backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleBenchmarkComplete = useCallback(() => {
    fetchAll()
  }, [fetchAll])

  const handleCSVExport = useCallback(() => {
    if (benchmarkResults.length === 0) return
    const headers = ['Strategy', 'Recall@5', 'Recall@10', 'MRR', 'Avg Query Time (ms)', 'Avg Cost ($)']
    const rows = benchmarkResults.map((r) =>
      [
        r.strategy,
        r.recall_5.toFixed(4),
        r.recall_10.toFixed(4),
        r.mrr.toFixed(4),
        r.avg_query_time_ms,
        r.avg_cost.toFixed(6),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','),
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `benchmark-${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [benchmarkResults])

  const costCards = stats ? mapStatsToCostCards(stats) : fallbackCostCards
  const { rows: benRows, chartData: benChartData } =
    benchmarkResults.length > 0
      ? mapBenchmarkResults(benchmarkResults)
      : { rows: fallbackBenchmarkRows, chartData: fallbackChartData }

  const costRows = costDetailRows.length > 0 ? costDetailRows : []
  const hasCostData = costRows.length > 0
  const hasBenchmarkData = benRows.length > 0

  if (error) {
    return (
      <div className="space-y-2">
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">Performance Analytics</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Detailed metrics and benchmarking across multiple retrieval strategies.
            </p>
          </div>
        </header>
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4 mt-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchAll}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">Performance Analytics</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Detailed metrics and benchmarking across multiple retrieval strategies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            iconLeft={<Download className="h-4 w-4" />}
            onClick={handleCSVExport}
            disabled={!hasBenchmarkData}
          >
            Export CSV
          </Button>
          <BenchmarkRunButton
            onStart={() => {}}
            onComplete={handleBenchmarkComplete}
          />
        </div>
      </header>

      {loading ? (
        <div className="space-y-8 mt-6 animate-pulse">
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
                <div className="h-4 w-32 rounded bg-neutral-200" />
                <div className="mt-3 h-8 w-20 rounded bg-neutral-200" />
                <div className="mt-5 space-y-2 border-t border-surface-border pt-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-4 w-24 rounded bg-neutral-100" />
                      <div className="h-4 w-12 rounded bg-neutral-100" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="h-64 rounded-2xl border border-surface-border bg-white" />
        </div>
      ) : (
        <>
          <Section title="Cost Breakdown" icon={<Banknote className="h-5 w-5" />}>
            <div className="grid gap-5 md:grid-cols-2">
              {costCards.map((card) => (
                <CostCardItem key={card.title} data={card} />
              ))}
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card">
              {hasCostData ? (
                <table className="w-full text-sm">
                  <thead className="bg-surface-muted text-xs uppercase tracking-wider text-neutral-500">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">Component</th>
                      <th className="px-6 py-3 text-left font-medium">Tokens In</th>
                      <th className="px-6 py-3 text-left font-medium">Tokens Out</th>
                      <th className="px-6 py-3 text-left font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {costRows.map((row, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 text-neutral-700">{row.component}</td>
                        <td className="px-6 py-4 text-neutral-700">
                          {row.tokens_in !== null ? formatNumber(row.tokens_in) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-neutral-700">
                          {row.tokens_out !== null ? formatNumber(row.tokens_out) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-neutral-700">${row.cost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center py-12 text-sm text-neutral-500">
                  No cost data yet. Run ingestion and benchmarks to populate.
                </div>
              )}
            </div>
          </Section>

          <Section
            title="Benchmark Results"
            icon={<BarChart3 className="h-5 w-5" />}
            action={<BenchmarkLegend />}
          >
            {hasBenchmarkData ? (
              <>
                <BenchmarkChart data={benChartData} />
                <div className="mt-5">
                  <BenchmarkTable rows={benRows} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-surface-border bg-white py-16 shadow-card">
                <BarChart3 className="mb-4 h-10 w-10 text-neutral-300" />
                <p className="text-sm text-neutral-500">
                  No benchmark data. Click &apos;Run Benchmark&apos; to generate.
                </p>
                <div className="mt-4">
                  <BenchmarkRunButton
                    onStart={() => {}}
                    onComplete={handleBenchmarkComplete}
                  />
                </div>
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}
