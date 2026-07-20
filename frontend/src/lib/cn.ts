type ClassValue = string | number | null | undefined | false | Record<string, boolean | null | undefined> | ClassValue[]

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []
  const walk = (value: ClassValue) => {
    if (!value && value !== 0) return
    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value))
      return
    }
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    if (typeof value === 'object') {
      for (const [key, val] of Object.entries(value)) {
        if (val) out.push(key)
      }
    }
  }
  inputs.forEach(walk)
  return out.join(' ')
}
