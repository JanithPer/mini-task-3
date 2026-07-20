import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onClear: () => void
  disabled: boolean
  loading: boolean
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  disabled,
  loading,
}: SearchBarProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!disabled && !loading) onSubmit()
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="relative flex-1">
        <Input
          iconLeft={<Search className="h-4 w-4" />}
          placeholder="Ask a question about AI/ML papers..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search query"
          disabled={disabled || loading}
        />
        {value.length > 0 && !loading && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              onClear()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:text-neutral-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" size="lg" className="sm:px-8 min-w-[120px]" disabled={disabled || loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching...
          </>
        ) : (
          'Search'
        )}
      </Button>
    </form>
  )
}
