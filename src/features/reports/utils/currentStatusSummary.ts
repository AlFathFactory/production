import { toFiniteNumber } from '../../production/utils'
import type { CurrentStatusRow } from '../types'

export interface CurrentStatusMetric {
  quantity: number
  weightKg: number
}

export interface CurrentStatusSummaryData {
  items: number
  totalQuantity: number
  remainingCut: CurrentStatusMetric
  waitingIssuePacking: CurrentStatusMetric
  waitingReceivePacking: CurrentStatusMetric
  waitingRolling: CurrentStatusMetric
  readyToDispense: CurrentStatusMetric
  remainingToDispense: CurrentStatusMetric
}

export function computeCurrentStatusSummary(rows: CurrentStatusRow[]): CurrentStatusSummaryData {
  const summary: CurrentStatusSummaryData = {
    items: rows.length,
    totalQuantity: 0,
    remainingCut: { quantity: 0, weightKg: 0 },
    waitingIssuePacking: { quantity: 0, weightKg: 0 },
    waitingReceivePacking: { quantity: 0, weightKg: 0 },
    waitingRolling: { quantity: 0, weightKg: 0 },
    readyToDispense: { quantity: 0, weightKg: 0 },
    remainingToDispense: { quantity: 0, weightKg: 0 },
  }

  for (const row of rows) {
    summary.totalQuantity += toFiniteNumber(row.total_quantity)
    summary.remainingCut.quantity += toFiniteNumber(row.remaining_cut)
    summary.remainingCut.weightKg += toFiniteNumber(row.remaining_cut_weight_kg)
    summary.waitingIssuePacking.quantity += toFiniteNumber(row.waiting_issue_packing_qty)
    summary.waitingIssuePacking.weightKg += toFiniteNumber(row.waiting_issue_packing_weight_kg)
    summary.waitingReceivePacking.quantity += toFiniteNumber(row.waiting_receive_packing_qty)
    summary.waitingReceivePacking.weightKg += toFiniteNumber(row.waiting_receive_packing_weight_kg)
    summary.waitingRolling.quantity += toFiniteNumber(row.waiting_rolling_qty)
    summary.waitingRolling.weightKg += toFiniteNumber(row.waiting_rolling_weight_kg)
    summary.readyToDispense.quantity += toFiniteNumber(row.ready_to_dispense_qty)
    summary.readyToDispense.weightKg += toFiniteNumber(row.ready_to_dispense_weight_kg)
    summary.remainingToDispense.quantity += toFiniteNumber(row.remaining_to_dispense)
    summary.remainingToDispense.weightKg += toFiniteNumber(row.remaining_to_dispense_weight_kg)
  }

  return summary
}
