import { Pill } from '@/components/ui/Pill'
import type { Strategy, StrategyId } from '@/types'

interface RetrievalStrategiesProps {
  options: Strategy[]
  selected: StrategyId[]
  onToggle: (id: StrategyId) => void
}

export function RetrievalStrategies({ options, selected, onToggle }: RetrievalStrategiesProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Retrieval Strategies
      </h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Pill
            key={option.id}
            selected={selected.includes(option.id)}
            onClick={() => onToggle(option.id)}
          >
            {option.label}
          </Pill>
        ))}
      </div>
    </div>
  )
}
