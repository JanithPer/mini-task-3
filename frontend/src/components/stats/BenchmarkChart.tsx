import { Card } from '@/components/ui/Card'
import type { ChartBar } from '@/types'

interface BenchmarkChartProps {
  data: ChartBar[]
}

const series: Array<{ key: keyof Omit<ChartBar, 'label'>; color: string; label: string }> = [
  { key: 'recall5', color: '#0a0a0a', label: 'Recall@5' },
  { key: 'recall10', color: '#5b5bf3', label: 'Recall@10' },
  { key: 'mrr', color: '#16a34a', label: 'MRR' },
]

export function BenchmarkChart({ data }: BenchmarkChartProps) {
  return (
    <Card className="overflow-x-auto p-8">
      <div className="flex h-64 items-end gap-8 px-2 min-w-max">
        {data.map((bar) => (
          <div key={bar.label} className="flex h-full shrink-0 flex-col items-center justify-end gap-3" style={{ width: '72px' }}>
            <div className="flex h-full w-full items-end justify-center gap-2">
              {series.map((s) => {
                const height = bar[s.key] * 100
                return (
                  <div
                    key={s.key}
                    className="flex w-6 h-full flex-col items-center justify-end"
                    title={`${s.label}: ${bar[s.key]}`}
                  >
                    <div
                      className="w-full rounded-t-md"
                      style={{ height: `${height}%`, backgroundColor: s.color }}
                    />
                  </div>
                )
              })}
            </div>
            <span className="text-xs font-medium text-neutral-600">{bar.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-neutral-500">
        Relative performance across top-k precision metrics
      </p>
    </Card>
  )
}

export function BenchmarkLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-neutral-600">
      {series.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  )
}
