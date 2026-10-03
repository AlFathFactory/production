import type { Json } from '../../../types/database'
import { ProductionImportError } from './productionImportResponse'
import type {
  ProductionBackendValidationError,
  ProductionBackendValidationResult,
  ProductionImportField,
  ProductionQuantityValues,
} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function requiredCount(record: Record<string, unknown>, key: string): number {
  const value = record[key]
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ProductionImportError('The validation service returned an unexpected response. Please try again.')
  }
  return value
}

function quantities(value: unknown): ProductionQuantityValues {
  const record = isRecord(value) ? value : {}
  return {
    bend_qty: finiteNumber(record.bend_qty),
    cut_qty: finiteNumber(record.cut_qty),
    dispensed_qty: finiteNumber(record.dispensed_qty),
    out_bend_qty: finiteNumber(record.out_bend_qty),
    rolling_qty: finiteNumber(record.rolling_qty),
    total_quantity: finiteNumber(record.total_quantity),
  }
}

function validationError(value: unknown): ProductionBackendValidationError {
  if (!isRecord(value)
    || typeof value.source_row !== 'number'
    || typeof value.error_code !== 'string'
    || typeof value.message !== 'string') {
    throw new ProductionImportError('The validation service returned an unreadable row error. Please try again.')
  }

  return {
    actualValue: typeof value.actual_value === 'number' || typeof value.actual_value === 'string'
      ? value.actual_value
      : null,
    article: typeof value.article === 'string' ? value.article : null,
    errorCode: value.error_code,
    field: typeof value.field === 'string' ? value.field as ProductionImportField : undefined,
    maximumValue: finiteNumber(value.maximum_value),
    message: value.message,
    routing: typeof value.routing === 'string' ? value.routing : null,
    sourceRow: value.source_row,
    stage: typeof value.stage === 'string' ? value.stage : null,
    values: quantities(value.values),
  }
}

export function parseProductionValidationResponse(data: Json): ProductionBackendValidationResult {
  if (!isRecord(data) || typeof data.valid !== 'boolean' || !Array.isArray(data.errors)) {
    throw new ProductionImportError('The validation service returned an unexpected response. Please try again.')
  }

  return {
    errors: data.errors.map(validationError),
    invalidRows: requiredCount(data, 'invalid_rows'),
    totalRows: requiredCount(data, 'total_rows'),
    valid: data.valid,
    validRows: requiredCount(data, 'valid_rows'),
  }
}
