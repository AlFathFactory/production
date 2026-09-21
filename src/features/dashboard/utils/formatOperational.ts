import { formatQuantity, toFiniteNumber, toNullableNumber } from '../../production/utils'

export function formatPcs(value: unknown): string {
  return `${formatQuantity(toNullableNumber(value) ?? 0)} pcs`
}

export function formatWeightKg(value: unknown): string {
  const numeric = toFiniteNumber(value)
  const rounded = Number(numeric.toFixed(1))
  return `${rounded.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`
}
