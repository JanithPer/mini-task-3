import { Download, Play, BarChart3, Coins } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Card'
import { CostCardItem } from '@/components/stats/CostCard'
import { BenchmarkChart, BenchmarkLegend } from '@/components/stats/BenchmarkChart'
import { BenchmarkTable } from '@/components/stats/BenchmarkTable'
import { OptimizationCard } from '@/components/stats/OptimizationCard'
import { costCards } from '@/data/mockCosts'
import { benchmarkRows, chartData } from '@/data/mockBenchmark'

export function StatsPage() {
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
          <Button variant="secondary" iconLeft={<Download className="h-4 w-4" />}>
            Export CSV
          </Button>
          <Button iconLeft={<Play className="h-4 w-4" />}>Run Benchmark</Button>
        </div>
      </header>

      <Section title="Cost Breakdown" icon={<Coins className="h-5 w-5" />}>
        <div className="grid gap-5 md:grid-cols-2">
          {costCards.map((card) => (
            <CostCardItem key={card.title} data={card} />
          ))}
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card">
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
              <tr>
                <td className="px-6 py-4 text-neutral-700">Hybrid Retrieval Core</td>
                <td className="px-6 py-4 text-neutral-700">1.2B</td>
                <td className="px-6 py-4 text-neutral-700">450M</td>
                <td className="px-6 py-4 text-neutral-700">$842.12</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-neutral-700">LLM Summarization Engine</td>
                <td className="px-6 py-4 text-neutral-700">85M</td>
                <td className="px-6 py-4 text-neutral-700">12M</td>
                <td className="px-6 py-4 text-neutral-700">$156.40</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-neutral-700">Image Extraction Pipeline</td>
                <td className="px-6 py-4 text-neutral-700">N/A</td>
                <td className="px-6 py-4 text-neutral-700">N/A</td>
                <td className="px-6 py-4 text-neutral-700">$42.80</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Benchmark Results"
        icon={<BarChart3 className="h-5 w-5" />}
        action={<BenchmarkLegend />}
      >
        <BenchmarkChart data={chartData} />
        <div className="mt-5">
          <BenchmarkTable rows={benchmarkRows} />
        </div>
      </Section>

      <Section className="pb-4">
        <OptimizationCard />
      </Section>
    </div>
  )
}
