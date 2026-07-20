import { Card } from '@/components/ui/Card'

export function SkeletonCard() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-9 w-9 rounded-md bg-neutral-200" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-48 rounded bg-neutral-200" />
            <div className="h-5 w-20 rounded bg-neutral-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-neutral-100" />
            <div className="h-4 w-11/12 rounded bg-neutral-100" />
            <div className="h-4 w-3/4 rounded bg-neutral-100" />
          </div>
          <div className="flex items-center gap-4 pt-1">
            <div className="h-4 w-28 rounded bg-neutral-100" />
            <div className="h-4 w-20 rounded bg-neutral-100" />
          </div>
        </div>
      </div>
    </Card>
  )
}
