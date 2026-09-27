import { toFiniteNumber, toNullableNumber } from '../../production/utils'
import { reportOperations } from '../constants'
import type { ReportOperation, ReportRow } from '../types'

interface ReportTotals {
  operations: number
  quantity: number
  weightKg: number
}

export interface OperationBreakdown extends ReportTotals {
  operation: ReportOperation
}

export interface ReportSummaryData extends ReportTotals {
  breakdown: OperationBreakdown[]
}

const quantityFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 })
const weightFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 })
const countFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })

function getOperationWeightKg(row: ReportRow): number {
  const operationWeightKg = toNullableNumber(row.operation_weight_kg)
  if (operationWeightKg !== null) {
    return operationWeightKg
  }

  const unitWeightKg = toNullableNumber(row.unit_weight_kg)
  return unitWeightKg === null ? 0 : toFiniteNumber(row.quantity) * unitWeightKg
}

export function computeReportSummary(rows: ReportRow[]): ReportSummaryData {
  const totalsByOperation = Object.fromEntries(
    reportOperations.map((operation) => [operation, { operations: 0, quantity: 0, weightKg: 0 }]),
  ) as Record<ReportOperation, ReportTotals>

  const totals: ReportTotals = { operations: rows.length, quantity: 0, weightKg: 0 }

  for (const row of rows) {
    const quantity = toFiniteNumber(row.quantity)
    const weightKg = getOperationWeightKg(row)
    const operationTotals = totalsByOperation[row.operation]

    totals.quantity += quantity
    totals.weightKg += weightKg
    operationTotals.operations += 1
    operationTotals.quantity += quantity
    operationTotals.weightKg += weightKg
  }

  return {
    ...totals,
    breakdown: reportOperations
      .filter((operation) => totalsByOperation[operation].operations > 0)
      .map((operation) => ({ operation, ...totalsByOperation[operation] })),
  }
}

export function formatReportCount(value: number): string {
  return countFormatter.format(value)
}

export function formatReportQuantity(value: number | string | null): string {
  return quantityFormatter.format(toFiniteNumber(value))
}

export function formatReportWeight(value: number | string | null): string {
  const numeric = toNullableNumber(value)
  return numeric === null ? '—' : weightFormatter.format(numeric)
}

export function formatReportWeightKg(value: number): string {
  return `${weightFormatter.format(value)} kg`
}

export function formatReportDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}
