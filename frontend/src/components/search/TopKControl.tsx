import { Slider } from '@/components/ui/Slider'

interface TopKControlProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function TopKControl({ value, onChange, min = 5, max = 50 }: TopKControlProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Top_k Results
        </h3>
        <span className="rounded-md bg-info-soft px-2 py-0.5 text-xs font-semibold text-info">
          {value}
        </span>
      </div>
      <Slider min={min} max={max} value={value} onChange={onChange} />
      <div className="flex justify-between text-[11px] text-neutral-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
