import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="flex-1">
        <Input
          iconLeft={<Search className="h-4 w-4" />}
          placeholder="Search the indexed repository…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search query"
        />
      </div>
      <Button type="submit" size="lg" className="sm:px-8">
        Search
      </Button>
    </form>
  )
}
