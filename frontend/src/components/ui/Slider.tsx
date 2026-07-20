import { useId, type ChangeEvent } from 'react'
import { cn } from '@/lib/cn'

interface SliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  className?: string
}

export function Slider({ min, max, step = 1, value, onChange, className }: SliderProps) {
  const id = useId()
  const percent = ((value - min) / (max - min)) * 100

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  return (
    <div className={cn('relative w-full', className)}>
      <div className="pointer-events-none relative h-1.5 w-full rounded-full bg-neutral-200">
        <div
          className="absolute left-0 top-0 h-1.5 rounded-full bg-neutral-300"
          style={{ width: `${percent}%` }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-accent shadow"
          style={{ left: `${percent}%` }}
        />
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
      />
    </div>
  )
}
