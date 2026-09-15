export interface NormalizedDateValue {
  isValid: boolean
  value: string | null
}

function formatDateParts(year: number, month: number, day: number): string | null {
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate()

  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > maxDay) {
    return null
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function normalizeProductionDate(value: unknown): NormalizedDateValue {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    return { isValid: true, value: null }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      isValid: true,
      value: formatDateParts(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate()),
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const milliseconds = Math.round((value - 25569) * 86_400_000)
    const parsed = new Date(milliseconds)
    const normalized = Number.isNaN(parsed.getTime())
      ? null
      : formatDateParts(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, parsed.getUTCDate())
    return { isValid: normalized !== null, value: normalized }
  }

  if (typeof value !== 'string') {
    return { isValid: false, value: null }
  }

  const text = value.trim()
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text)
  const dayFirstMatch = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(text)
  const parts = isoMatch
    ? [Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3])]
    : dayFirstMatch
      ? [Number(dayFirstMatch[3]), Number(dayFirstMatch[2]), Number(dayFirstMatch[1])]
      : null
  const normalized = parts ? formatDateParts(parts[0], parts[1], parts[2]) : null

  return { isValid: normalized !== null, value: normalized }
}
