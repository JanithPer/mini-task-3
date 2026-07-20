import { useState, useMemo } from 'react'
import { CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { BenchmarkRow } from '@/types'

interface BenchmarkTableProps {
  rows: BenchmarkRow[]
}

type SortKey = 'strategy' | 'recall5' | 'recall10' | 'mrr' | 'avgQueryMs' | 'avgCost'
type SortDir = 'asc' | 'desc'

interface Column {
  key: SortKey
  label: string
  numeric: boolean
}

const columns: Column[] = [
  { key: 'strategy', label: 'Strategy', numeric: false },
  { key: 'recall5', label: 'Recall@5', numeric: true },
  { key: 'recall10', label: 'Recall@10', numeric: true },
  { key: 'mrr', label: 'MRR', numeric: true },
  { key: 'avgQueryMs', label: 'Avg Query Time (ms)', numeric: true },
  { key: 'avgCost', label: 'Avg Cost ($)', numeric: true },
]

function parseMs(ms: string): number {
  return parseFloat(ms.replace('ms', '')) || 0
}

function parseCost(cost: string): number {
  return parseFloat(cost.replace('$', '')) || 0
}

function getSortValue(row: BenchmarkRow, key: SortKey): string | number {
  switch (key) {
    case 'strategy': return row.strategy
    case 'recall5': return row.recall5
    case 'recall10': return row.recall10
    case 'mrr': return row.mrr
    case 'avgQueryMs': return parseMs(row.avgQueryMs)
    case 'avgCost': return parseCost(row.avgCost)
  }
}

function formatCell(row: BenchmarkRow, key: SortKey): string {
  switch (key) {
    case 'strategy': return row.strategy
    case 'recall5': return row.recall5.toFixed(2)
    case 'recall10': return row.recall10.toFixed(2)
    case 'mrr': return row.mrr.toFixed(2)
    case 'avgQueryMs': return row.avgQueryMs
    case 'avgCost': return row.avgCost
  }
}

export function BenchmarkTable({ rows }: BenchmarkTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('recall10')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      const na = typeof va === 'number' ? va : 0
      const nb = typeof vb === 'number' ? vb : 0
      return sortDir === 'asc' ? na - nb : nb - na
    })
    return sorted
  }, [rows, sortKey, sortDir])

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="h-3 w-3 text-neutral-400" />
    return sortDir === 'desc' ? <ArrowDown className="h-3 w-3 text-ink" /> : <ArrowUp className="h-3 w-3 text-ink" />
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left font-medium cursor-pointer select-none hover:text-neutral-700 transition-colors"
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    <SortIcon columnKey={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {sortedRows.map((row) => (
              <tr
                key={row.strategy}
                className={row.isWinner ? 'bg-info-soft/40' : 'bg-white hover:bg-surface-muted transition-colors'}
              >
                <td className="px-6 py-4 font-medium text-neutral-900">
                  <span className="inline-flex items-center gap-2">
                    {row.isWinner && <CheckCircle2 className="h-4 w-4 text-success" />}
                    {row.strategy}
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-700">{formatCell(row, 'recall5')}</td>
                <td
                  className={
                    row.isWinner
                      ? 'px-6 py-4 font-semibold text-neutral-900'
                      : 'px-6 py-4 text-neutral-700'
                  }
                >
                  {formatCell(row, 'recall10')}
                </td>
                <td className="px-6 py-4 text-neutral-700">{formatCell(row, 'mrr')}</td>
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
