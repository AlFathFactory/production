import type { Json } from '../../../types/database'
import type { ProductionImportResult } from './types'

export class ProductionImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductionImportError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readableBackendFailure(message: string): string {
  const historyMatch = /Article (.+) already has production history in this lot; re-import is blocked/i.exec(message)

  if (historyMatch) {
    return `Article ${historyMatch[1]} already has Production history in this Lot and cannot be re-imported.`
  }
  if (/Admin role required/i.test(message)) {
    return 'Only an active Admin can import Production workbooks.'
  }
  if (/Production lot not found/i.test(message)) {
    return 'The selected Lot is no longer available.'
  }
  if (/Missing Component Article/i.test(message)) {
    return 'The backend found a row with no Component Article.'
  }
  if (/Invalid T\.QTY|T\.QTY must be zero or greater/i.test(message)) {
    return 'The backend rejected an invalid T. QTY value.'
  }
  if (/Stage quantities cannot be negative/i.test(message)) {
    return 'The backend rejected a negative stage quantity.'
  }

  return 'The backend rejected this workbook. Review the preview and try again.'
}

function requiredNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ProductionImportError('The import completed with an unexpected response. Refresh Production before trying again.')
  }
  return value
}

export function parseProductionImportResponse(data: Json): ProductionImportResult {
  if (!isRecord(data)) {
    throw new ProductionImportError('The import returned an unexpected response. Please try again.')
  }

  if (data.success !== true) {
    const message = typeof data.error === 'string' ? data.error : ''
    throw new ProductionImportError(readableBackendFailure(message))
  }

  if (typeof data.import_id !== 'string' || !isRecord(data.result)) {
    throw new ProductionImportError('The import completed with an unexpected response. Refresh Production before trying again.')
  }

  return {
    importId: data.import_id,
    itemsInserted: requiredNumber(data.result, 'items_inserted'),
    itemsUpdated: requiredNumber(data.result, 'items_updated'),
    rowsProcessed: requiredNumber(data.result, 'rows_processed'),
    skippedRows: requiredNumber(data, 'skipped_rows'),
    stageEntriesCreated: requiredNumber(data.result, 'stage_entries_created'),
  }
}

export function mapProductionImportRequestError(error: unknown): ProductionImportError {
  const code = isRecord(error) && typeof error.code === 'string' ? error.code : ''
  const message = isRecord(error) && typeof error.message === 'string'
    ? error.message
    : error instanceof Error
      ? error.message
      : ''

  if (code === '42501' || /Admin role required|permission denied/i.test(message)) {
    return new ProductionImportError('Only an active Admin can import Production workbooks.')
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new ProductionImportError('Unable to reach Production Control. Check your connection and try again.')
  }

  return new ProductionImportError(readableBackendFailure(message))
}
