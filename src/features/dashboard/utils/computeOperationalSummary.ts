import type { ProductionSearchRow } from '../../production/types'
import type { LotDashboardItem } from '../types'

export interface StageProgress {
  stage: 'CUT' | 'OUT_BEND' | 'BEND'
  completedQty: number
  remainingQty: number
}

export interface NextOperation {
  key: 'cut' | 'out_bend' | 'bend_return' | 'rolling' | 'dispense'
  label: string
  itemCount: number
}

export interface OperationalSummary {
  totalQty: number
  totalWeightKg: number
  cutWeightKg: number
  outBendWeightKg: number
  bendWeightKg: number
  weightsMissing: boolean
  stageProgress: StageProgress[]
  nextOperations: NextOperation[]
}

function toFinite(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

// Weights are presentation sums only: quantity × unit_weight_kg from
// search_production_items. Quantities/remaining/waiting counts stay on
// production_lot_dashboard backend values. No new backend fields.
function weightFor(quantity: number | null | undefined, unitWeightKg: number | null | undefined): number {
  const qty = toFinite(quantity)
  const unit = toFinite(unitWeightKg)
  if (qty === 0 || unit === 0) return 0
  return qty * unit
}

export function computeOperationalSummary(
  lots: LotDashboardItem[],
  items: ProductionSearchRow[],
): OperationalSummary {
  const totalQty = lots.reduce((sum, lot) => sum + lot.totalRequiredQuantity, 0)
  const cutCompletedQty = lots.reduce((sum, lot) => sum + lot.totalCutQuantity, 0)
  const cutRemainingQty = lots.reduce((sum, lot) => sum + lot.remainingCutQuantity, 0)
  const outBendCompletedQty = lots.reduce((sum, lot) => sum + lot.totalOutBendQuantity, 0)
  const outBendRemainingQty = lots.reduce((sum, lot) => sum + lot.remainingOutBendQuantity, 0)
  const bendCompletedQty = lots.reduce((sum, lot) => sum + lot.totalBendQuantity, 0)
  const bendRemainingQty = lots.reduce((sum, lot) => sum + lot.remainingBendQuantity, 0)

  let totalWeightKg = 0
  let cutWeightKg = 0
  let outBendWeightKg = 0
  let bendWeightKg = 0
  let weightsMissing = false

  for (const item of items) {
    if (item.unit_weight_kg === null || item.unit_weight_kg === undefined) {
      if (toFinite(item.total_quantity) > 0) weightsMissing = true
      continue
    }
    totalWeightKg += weightFor(item.total_quantity, item.unit_weight_kg)
    cutWeightKg += weightFor(item.cut_total, item.unit_weight_kg)
    outBendWeightKg += weightFor(item.out_bend_total, item.unit_weight_kg)
    bendWeightKg += weightFor(item.bend_total, item.unit_weight_kg)
  }

  const waitingCut = lots.reduce((sum, lot) => sum + lot.itemsWaitingCut, 0)
  const waitingOutBend = lots.reduce((sum, lot) => sum + lot.itemsWaitingOutBend, 0)
  const waitingBendReturn = lots.reduce((sum, lot) => sum + lot.itemsWaitingBendReturn, 0)
  const waitingRolling = lots.reduce((sum, lot) => sum + lot.itemsWaitingRolling, 0)
  const inWarehouse = lots.reduce((sum, lot) => sum + lot.itemsInWarehouse, 0)

  return {
    totalQty,
    totalWeightKg,
    cutWeightKg,
    outBendWeightKg,
    bendWeightKg,
    weightsMissing,
    stageProgress: [
      { stage: 'CUT', completedQty: cutCompletedQty, remainingQty: cutRemainingQty },
      { stage: 'OUT_BEND', completedQty: outBendCompletedQty, remainingQty: outBendRemainingQty },
      { stage: 'BEND', completedQty: bendCompletedQty, remainingQty: bendRemainingQty },
    ],
    nextOperations: [
      { key: 'cut', label: 'Needs Cutting', itemCount: waitingCut },
      { key: 'out_bend', label: 'Needs Out-Bend', itemCount: waitingOutBend },
      { key: 'bend_return', label: 'Needs Bending', itemCount: waitingBendReturn },
      { key: 'rolling', label: 'Needs Rolling', itemCount: waitingRolling },
      { key: 'dispense', label: 'Needs Dispense', itemCount: inWarehouse },
    ],
  }
}
