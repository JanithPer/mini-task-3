import { CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { BenchmarkRow } from '@/types'

interface BenchmarkTableProps {
  rows: BenchmarkRow[]
}

export function BenchmarkTable({ rows }: BenchmarkTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Strategy</th>
              <th className="px-6 py-3 text-left font-medium">Recall@5</th>
              <th className="px-6 py-3 text-left font-medium">Recall@10</th>
              <th className="px-6 py-3 text-left font-medium">MRR</th>
              <th className="px-6 py-3 text-left font-medium">Avg Query Time (ms)</th>
              <th className="px-6 py-3 text-left font-medium">Avg Cost ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {rows.map((row) => (
              <tr
                key={row.strategy}
                className={row.isWinner ? 'bg-info-soft/40' : 'bg-white hover:bg-surface-muted'}
              >
                <td className="px-6 py-4 font-medium text-neutral-900">
                  <span className="inline-flex items-center gap-2">
                    {row.isWinner && <CheckCircle2 className="h-4 w-4 text-success" />}
                    {row.strategy}
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-700">{row.recall5.toFixed(2)}</td>
                <td
                  className={
                    row.isWinner
                      ? 'px-6 py-4 font-semibold text-neutral-900'
                      : 'px-6 py-4 text-neutral-700'
                  }
                >
                  {row.recall10.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-neutral-700">{row.mrr.toFixed(2)}</td>
                <td className="px-6 py-4 text-neutral-700">{row.avgQueryMs}</td>
                <td className="px-6 py-4 text-neutral-700">{row.avgCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
