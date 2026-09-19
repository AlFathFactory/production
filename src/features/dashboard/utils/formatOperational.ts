import { formatQuantity } from '../../production/utils'

export function formatPcs(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '0 pcs'
  return `${formatQuantity(value)} pcs`
}

export function formatWeightKg(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '0 kg'
  const rounded = Number(value.toFixed(1))
  return `${rounded.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`
}
