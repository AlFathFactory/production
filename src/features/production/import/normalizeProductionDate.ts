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

function parseTextDate(text: string): [year: number, month: number, day: number] | null {
  const yearFirstSlash = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(text)
  if (yearFirstSlash) {
    return [Number(yearFirstSlash[1]), Number(yearFirstSlash[2]), Number(yearFirstSlash[3])]
  }

  const monthFirstSlash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text)
  if (monthFirstSlash) {
    return [Number(monthFirstSlash[3]), Number(monthFirstSlash[1]), Number(monthFirstSlash[2])]
  }

  const yearFirstHyphen = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text)
  if (yearFirstHyphen) {
    return [Number(yearFirstHyphen[1]), Number(yearFirstHyphen[2]), Number(yearFirstHyphen[3])]
  }

  const dayFirstHyphen = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(text)
  if (dayFirstHyphen) {
    return [Number(dayFirstHyphen[3]), Number(dayFirstHyphen[2]), Number(dayFirstHyphen[1])]
  }

  return null
}

export function normalizeProductionDate(value: unknown): NormalizedDateValue {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    return { isValid: true, value: null }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const normalized = formatDateParts(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate())
    return {
      isValid: normalized !== null,
      value: normalized,
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
  const parts = parseTextDate(text)
  const normalized = parts ? formatDateParts(parts[0], parts[1], parts[2]) : null

  return { isValid: normalized !== null, value: normalized }
}
