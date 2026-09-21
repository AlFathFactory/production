export function toFiniteNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'string' && value.trim() === '') {
    return null
  }
  const parsed = typeof value === 'number' ? value : Number(value as string)
  return Number.isFinite(parsed) ? parsed : null
}

export function formatQuantity(value: number | string | null | undefined): string {
  const numeric = toNullableNumber(value)
  if (numeric === null) {
    return '0'
  }

  return String(Number(numeric.toFixed(6)))
}

export function formatPercent(value: number | null): string {
  const percent = value === null || !Number.isFinite(value) ? 0 : Math.min(100, Math.max(0, value))
  return `${String(Number(percent.toFixed(1)))}%`
}

export function getCurrentDateInputValue(): string {
  const currentDate = new Date()
  currentDate.setMinutes(currentDate.getMinutes() - currentDate.getTimezoneOffset())
  return currentDate.toISOString().slice(0, 10)
}
