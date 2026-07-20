import { OptionCard } from '@/components/ui/OptionCard'
import type { ChunkingStrategy, ChunkStrategy } from '@/types'

interface ChunkingStrategyProps {
  options: ChunkingStrategy[]
  selected: ChunkStrategy
  onSelect: (id: ChunkStrategy) => void
}

export function ChunkingStrategyControl({ options, selected, onSelect }: ChunkingStrategyProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Chunking Strategy
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <OptionCard
            key={option.id}
            selected={selected === option.id}
            onClick={() => onSelect(option.id)}
            title={option.label}
            description={option.description}
          />
        ))}
      </div>
    </div>
  )
}
