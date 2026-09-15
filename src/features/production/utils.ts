export function formatQuantity(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '0'
  }

  return String(Number(value.toFixed(6)))
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
