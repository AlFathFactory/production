import type { ProductionSearchRow } from '../../production/types'
import { toFiniteNumber, toNullableNumber } from '../../production/utils'
import type { LotDashboardItem } from '../types'

export interface StageProgress {
  stage: 'CUT' | 'OUT_BEND' | 'BEND'
  completedQty: number
  remainingQty: number
}

export interface OperationalSummary {
  totalWeightKg: number
  cutWeightKg: number
  readyForBendWeightKg: number
  outBendWeightKg: number
  bendWeightKg: number
  awaitingBendReturnWeightKg: number
  weightsMissing: boolean
  stageProgress: StageProgress[]
}

// Weights are presentation sums only: quantity × unit_weight_kg from
// search_production_items. Quantities/remaining/waiting counts stay on
// production_lot_dashboard backend values. No new backend fields.
// Numeric coercion matters: PostgREST can return numeric columns as strings.
function weightFor(quantity: unknown, unitWeightKg: unknown): number {
  const qty = toFiniteNumber(quantity)
  const unit = toFiniteNumber(unitWeightKg)
  if (qty === 0 || unit === 0) return 0
  return qty * unit
}

export function computeOperationalSummary(
  lots: LotDashboardItem[],
  items: ProductionSearchRow[],
): OperationalSummary {
  const cutCompletedQty = lots.reduce((sum, lot) => sum + lot.totalCutQuantity, 0)
  const cutRemainingQty = lots.reduce((sum, lot) => sum + lot.remainingCutQuantity, 0)
  const outBendCompletedQty = lots.reduce((sum, lot) => sum + lot.totalOutBendQuantity, 0)
  const outBendRemainingQty = lots.reduce((sum, lot) => sum + lot.remainingOutBendQuantity, 0)
  const bendCompletedQty = lots.reduce((sum, lot) => sum + lot.totalBendQuantity, 0)
  const bendRemainingQty = lots.reduce((sum, lot) => sum + lot.remainingBendQuantity, 0)

  let totalWeightKg = 0
  let cutWeightKg = 0
  let readyForBendWeightKg = 0
  let outBendWeightKg = 0
  let bendWeightKg = 0
  let awaitingBendReturnWeightKg = 0
  let weightsMissing = false

  for (const item of items) {
    if (toNullableNumber(item.unit_weight_kg) === null) {
      if (toFiniteNumber(item.total_quantity) > 0) weightsMissing = true
      continue
    }
    totalWeightKg += weightFor(item.total_quantity, item.unit_weight_kg)
    cutWeightKg += weightFor(item.cut_total, item.unit_weight_kg)
    outBendWeightKg += weightFor(item.out_bend_total, item.unit_weight_kg)
    bendWeightKg += weightFor(item.bend_total, item.unit_weight_kg)
    if (item.routing === 'BEND') {
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
    stageProgress: [
      { stage: 'CUT', completedQty: cutCompletedQty, remainingQty: cutRemainingQty },
      { stage: 'OUT_BEND', completedQty: outBendCompletedQty, remainingQty: outBendRemainingQty },
      { stage: 'BEND', completedQty: bendCompletedQty, remainingQty: bendRemainingQty },
    ],
  }
}
