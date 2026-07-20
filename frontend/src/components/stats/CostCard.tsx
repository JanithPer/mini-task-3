import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { CostCard as CostCardData } from '@/types'

interface CostCardProps {
  data: CostCardData
}

export function CostCardItem({ data }: CostCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {data.title}
      </h3>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-3xl font-semibold text-neutral-900">{data.amount}</span>
        {data.trend && <Badge tone={data.trend.tone}>{data.trend.label}</Badge>}
      </div>
      <ul className="mt-5 space-y-2 border-t border-surface-border pt-4">
        {data.items.map((item) => (
          <li key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">{item.label}</span>
            <span className="font-medium text-neutral-900">{item.value}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
