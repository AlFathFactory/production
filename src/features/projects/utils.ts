export function naturalCompare(first: string, second: string): number {
  return first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' })
}

export function normalizeOptionalText(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue || null
}
