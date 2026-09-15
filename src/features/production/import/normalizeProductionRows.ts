import type { ProductionRoute } from '../types'
import { normalizeProductionDate } from './normalizeProductionDate'
import { ProductionWorkbookError } from './parseProductionWorkbook'
import type {
  NormalizedProductionImportRow,
  NormalizedProductionSheet,
  ProductionImportField,
  ProductionImportIssue,
  RawWorkbookCell,
  RawWorkbookRow,
} from './types'

type ColumnKey =
  | 'action_date'
  | 'admin_name'
  | 'article'
  | 'bend_date'
  | 'bend_qty'
  | 'cut_date'
  | 'cut_qty'
  | 'designation'
  | 'dispensed_qty'
  | 'material'
  | 'out_bend_date'
  | 'out_bend_qty'
  | 'profile'
  | 'remark'
  | 'rolling_date'
  | 'rolling_qty'
  | 'routing'
  | 'total_quantity'
  | 'unit_weight_kg'

const MAX_HEADER_ROWS = 10

const headerAliases: Record<ColumnKey, readonly string[]> = {
  action_date: ['date'],
  admin_name: ['admin'],
  article: ['component article'],
  bend_date: ['bend date'],
  bend_qty: ['bend qty', 'bend quantity'],
  cut_date: ['cut date'],
  cut_qty: ['cut qty', 'cut quantity'],
  designation: ['component designation en', 'component designation'],
  dispensed_qty: ['dispensed', 'dispensed qty'],
  material: ['material'],
  out_bend_date: ['out bend date'],
  out_bend_qty: ['out bend qty', 'out bend quantity'],
  profile: ['profile'],
  remark: ['remark'],
  rolling_date: ['rolling date'],
  rolling_qty: ['rolling qty', 'rolling quantity'],
  routing: ['bend / no bend', 'bend/no bend'],
  total_quantity: ['t. qty', 't.qty', 'total quantity'],
  unit_weight_kg: ['unite wt. kg', 'unit wt. kg', 'unit weight kg'],
}

function normalizeHeader(value: RawWorkbookCell): string {
  return value === null ? '' : String(value).trim().replace(/\s+/g, ' ').toLowerCase()
}

function columnForHeader(value: RawWorkbookCell): ColumnKey | null {
  const header = normalizeHeader(value)
  return (Object.keys(headerAliases) as ColumnKey[]).find((key) => headerAliases[key].includes(header)) ?? null
}

function isBlank(value: RawWorkbookCell | undefined): boolean {
  return value === null || value === undefined || (typeof value === 'string' && !value.trim())
}

function textValue(value: RawWorkbookCell | undefined): string | null {
  return isBlank(value) ? null : String(value).trim()
}

function issue(sourceRow: number, field: ProductionImportField, severity: 'error' | 'warning', message: string): ProductionImportIssue {
  return { field, message, severity, sourceRow }
}

function numberValue(
  value: RawWorkbookCell | undefined,
  sourceRow: number,
  field: ProductionImportField,
  label: string,
  blankValue: number | null,
  issues: ProductionImportIssue[],
): number | null {
  if (isBlank(value)) {
    return blankValue
  }

  const parsed = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(parsed)) {
    issues.push(issue(sourceRow, field, 'error', `${label} is not a valid number.`))
    return null
  }

  return parsed
}

function dateValue(
  value: RawWorkbookCell | undefined,
  sourceRow: number,
  field: ProductionImportField,
  label: string,
  issues: ProductionImportIssue[],
): string | null {
  const normalized = normalizeProductionDate(value)
  if (!normalized.isValid) {
    issues.push(issue(sourceRow, field, 'error', `${label} is not a recognized date.`))
  }
  return normalized.value
}

function routeValue(value: RawWorkbookCell | undefined, sourceRow: number, issues: ProductionImportIssue[]): ProductionRoute {
  const route = (textValue(value) ?? '').toUpperCase().replace(/\s+/g, ' ')
  const knownRoutes: ProductionRoute[] = ['BEND', 'NO BEND', 'ROD', 'ROLLING', 'LADDER', 'OTHER']

  if (knownRoutes.includes(route as ProductionRoute)) {
    return route as ProductionRoute
  }

  const sourceValue = route || 'blank'
  issues.push(issue(sourceRow, 'routing', 'warning', `Route “${sourceValue}” was normalized to OTHER.`))
  return 'OTHER'
}

function detectHeaderRow(rows: RawWorkbookRow[]): number {
  const searchRows = rows.slice(0, MAX_HEADER_ROWS)
  return searchRows.findIndex((row) => {
    const keys = row.map(columnForHeader)
    return keys.includes('article') && keys.includes('total_quantity')
  })
}

export function normalizeProductionRows(rows: RawWorkbookRow[]): NormalizedProductionSheet {
  const headerIndex = detectHeaderRow(rows)
  if (headerIndex < 0) {
    throw new ProductionWorkbookError('Could not find the expected Production headers in this sheet.')
  }

  const headerRow = rows[headerIndex]
  const columns = new Map<ColumnKey, number>()
  const ignoredHeaders: string[] = []

  headerRow.forEach((header, index) => {
    const key = columnForHeader(header)
    const label = textValue(header)
    if (key && !columns.has(key)) {
      columns.set(key, index)
    } else if (label && !key) {
      ignoredHeaders.push(label)
    }
  })

  const cell = (row: RawWorkbookRow, key: ColumnKey) => {
    const columnIndex = columns.get(key)
    return columnIndex === undefined ? undefined : row[columnIndex]
  }

  const normalizedRows = rows.slice(headerIndex + 1).flatMap((row, offset) => {
    if (row.every(isBlank)) {
      return []
    }

    const sourceRow = headerIndex + offset + 2
    const issues: ProductionImportIssue[] = []
    const normalized: NormalizedProductionImportRow = {
      action_date: dateValue(cell(row, 'action_date'), sourceRow, 'action_date', 'Date', issues),
      admin_name: textValue(cell(row, 'admin_name')),
      article: textValue(cell(row, 'article')) ?? '',
      bend_date: dateValue(cell(row, 'bend_date'), sourceRow, 'bend_date', 'Bend Date', issues),
      bend_qty: numberValue(cell(row, 'bend_qty'), sourceRow, 'bend_qty', 'Bend Qty', 0, issues),
      cut_date: dateValue(cell(row, 'cut_date'), sourceRow, 'cut_date', 'Cut Date', issues),
      cut_qty: numberValue(cell(row, 'cut_qty'), sourceRow, 'cut_qty', 'CUT QTY', 0, issues),
      designation: textValue(cell(row, 'designation')),
      dispensed_qty: numberValue(cell(row, 'dispensed_qty'), sourceRow, 'dispensed_qty', 'Dispensed', 0, issues),
      material: textValue(cell(row, 'material')),
      out_bend_date: dateValue(cell(row, 'out_bend_date'), sourceRow, 'out_bend_date', 'Out Bend Date', issues),
      out_bend_qty: numberValue(cell(row, 'out_bend_qty'), sourceRow, 'out_bend_qty', 'Out Bend QTY', 0, issues),
      profile: textValue(cell(row, 'profile')),
      remark: textValue(cell(row, 'remark')),
      rolling_date: dateValue(cell(row, 'rolling_date'), sourceRow, 'rolling_date', 'Rolling Date', issues),
      rolling_qty: numberValue(cell(row, 'rolling_qty'), sourceRow, 'rolling_qty', 'Rolling QTY', 0, issues),
      routing: routeValue(cell(row, 'routing'), sourceRow, issues),
      source_row: sourceRow,
      total_quantity: numberValue(cell(row, 'total_quantity'), sourceRow, 'total_quantity', 'T. QTY', null, issues),
      unit_weight_kg: numberValue(cell(row, 'unit_weight_kg'), sourceRow, 'unit_weight_kg', 'Unit Weight', null, issues),
    }

    return [{ issues, row: normalized }]
  })

  if (normalizedRows.length === 0) {
    throw new ProductionWorkbookError('No Production rows were found below the detected header.')
  }

  return { headerRow: headerIndex + 1, ignoredHeaders, rows: normalizedRows }
}
