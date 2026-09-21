import type { ProductionSearchRow } from '../../production/types'
import { toFiniteNumber, toNullableNumber } from '../../production/utils'

export type WeightRoute = 'ALL' | 'BEND' | 'NO BEND'

export interface OperationalSummary {
  totalWeightKg: number
  cutWeightKg: number
  readyForBendWeightKg: number
  outBendWeightKg: number
  bendWeightKg: number
  awaitingBendReturnWeightKg: number
  weightsMissing: boolean
  cutPercent: number
  outBendPercent: number
  bendPercent: number
  readyForBendPercent: number
  awaitingBendReturnPercent: number
}

// Weights are presentation sums: quantity × unit_weight_kg from search_production_items.
// Numeric coercion matters: PostgREST can return numeric columns as strings.
function weightFor(quantity: unknown, unitWeightKg: unknown): number {
  const qty = toFiniteNumber(quantity)
  const unit = toFiniteNumber(unitWeightKg)
  if (qty === 0 || unit === 0) return 0
  return qty * unit
}

function percentOf(value: number, total: number): number {
  return total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0
}

export function computeOperationalSummary(items: ProductionSearchRow[], route: WeightRoute): OperationalSummary {
  let totalWeightKg = 0
  let cutWeightKg = 0
  let bendCutWeightKg = 0
  let readyForBendWeightKg = 0
  let outBendWeightKg = 0
  let bendWeightKg = 0
  let awaitingBendReturnWeightKg = 0
  let weightsMissing = false

  for (const item of items) {
    if (route !== 'ALL' && item.routing !== route) continue
    if (toNullableNumber(item.unit_weight_kg) === null) {
      if (toFiniteNumber(item.total_quantity) > 0) weightsMissing = true
      continue
    }
    totalWeightKg += weightFor(item.total_quantity, item.unit_weight_kg)
    cutWeightKg += weightFor(item.cut_total, item.unit_weight_kg)
    outBendWeightKg += weightFor(item.out_bend_total, item.unit_weight_kg)
    bendWeightKg += weightFor(item.bend_total, item.unit_weight_kg)
    if (item.routing === 'BEND') {
      bendCutWeightKg += weightFor(item.cut_total, item.unit_weight_kg)
      // These are outstanding stage balances, not cumulative production totals.
      readyForBendWeightKg += weightFor(
        Math.max(0, toFiniteNumber(item.cut_total) - toFiniteNumber(item.out_bend_total)),
        item.unit_weight_kg,
      )
      awaitingBendReturnWeightKg += weightFor(
        Math.max(0, toFiniteNumber(item.out_bend_total) - toFiniteNumber(item.bend_total)),
        item.unit_weight_kg,
      )
    }
  }

  return {
    totalWeightKg,
    cutWeightKg,
    readyForBendWeightKg,
    outBendWeightKg,
    bendWeightKg,
    awaitingBendReturnWeightKg,
    weightsMissing,
    cutPercent: percentOf(cutWeightKg, totalWeightKg),
    outBendPercent: percentOf(outBendWeightKg, totalWeightKg),
    bendPercent: percentOf(bendWeightKg, totalWeightKg),
    readyForBendPercent: percentOf(readyForBendWeightKg, bendCutWeightKg),
    awaitingBendReturnPercent: percentOf(awaitingBendReturnWeightKg, outBendWeightKg),
  }
}
