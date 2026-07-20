import { Card } from '@/components/ui/Card'

export function OptimizationCard() {
  return (
    <Card className="relative overflow-hidden p-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-neutral-900">Automated Optimization</h2>
          <p className="max-w-md text-sm leading-relaxed text-neutral-600">
            The engine continuously re-evaluates retrieval strategies against your specific
            dataset to find the most cost-efficient precision curve.
          </p>
          <div className="pt-2">
            <span className="block h-0.5 w-16 bg-ink" />
          </div>
        </div>
        <div className="relative hidden h-44 md:block">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-neutral-100 to-white">
            <div className="absolute right-6 top-6 flex flex-col items-center">
              <span className="text-3xl font-semibold text-neutral-900">4.8</span>
              <span className="mt-1 text-xs text-neutral-500">avg rating</span>
              <div className="mt-2 flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-3 text-[10px] text-neutral-500">
              <div className="rounded-md bg-white/70 p-2">Region<br /><span className="text-neutral-800">USA</span></div>
              <div className="rounded-md bg-white/70 p-2">Reviews<br /><span className="text-neutral-800">2.1k</span></div>
              <div className="rounded-md bg-white/70 p-2">Latency<br /><span className="text-neutral-800">32ms</span></div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
