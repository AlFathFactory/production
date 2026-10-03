import type { ProductionRoute } from '../types'
import { normalizeProductionDate } from './normalizeProductionDate'
import { ProductionWorkbookError } from './parseProductionWorkbook'
import type {
  NormalizedProductionImportRow,
  NormalizedProductionSheet,
  ProductionImportField,
  ProductionImportFieldDefinition,
  ProductionImportIssue,
  ProductionImportMapping,
  ProductionSourceColumn,
  RawWorkbookCell,
  RawWorkbookRow,
} from './types'

const MAX_HEADER_ROWS = 20
const SAMPLE_LIMIT = 3

export const PRODUCTION_IMPORT_FIELDS: readonly ProductionImportFieldDefinition[] = [
  { key: 'article', label: 'Article', required: true, kind: 'text', aliases: ['article', 'component article', 'part no', 'part number', 'item code', 'component no', 'component number'] },
  { key: 'profile', label: 'Profile', required: false, kind: 'text', aliases: ['profile', 'section', 'section profile'] },
  { key: 'routing', label: 'Routing', required: false, kind: 'route', aliases: ['routing', 'route', 'bend no bend', 'bend or no bend'] },
  { key: 'designation', label: 'Designation', required: false, kind: 'text', aliases: ['designation', 'description', 'component designation en', 'component designation'] },
  { key: 'material', label: 'Material', required: false, kind: 'text', aliases: ['material', 'material grade', 'grade'] },
  { key: 'total_quantity', label: 'Total Quantity', required: true, kind: 'number', aliases: ['t qty', 'total qty', 'total quantity', 'qty', 'quantity', 'qty lot', 'sum of qty lot'] },
  { key: 'unit_weight_kg', label: 'Unit Weight', required: false, kind: 'number', aliases: ['unit weight', 'unit weight kg', 'unit wt', 'unit wt kg', 'unite wt', 'unite wt kg', 'weight each'] },
  { key: 'remark', label: 'Remark', required: false, kind: 'text', aliases: ['remark', 'remarks', 'note', 'notes'] },
  { key: 'cut_qty', label: 'Cut Quantity', required: false, kind: 'number', aliases: ['cut qty', 'cut quantity'] },
  { key: 'cut_date', label: 'Cut Date', required: false, kind: 'date', aliases: ['cut date'] },
  { key: 'out_bend_qty', label: 'Out Bend Quantity', required: false, kind: 'number', aliases: ['out bend qty', 'out bend quantity'] },
  { key: 'out_bend_date', label: 'Out Bend Date', required: false, kind: 'date', aliases: ['out bend date'] },
  { key: 'bend_qty', label: 'Bend Quantity', required: false, kind: 'number', aliases: ['bend qty', 'bend quantity'] },
  { key: 'bend_date', label: 'Bend Date', required: false, kind: 'date', aliases: ['bend date'] },
  { key: 'rolling_qty', label: 'Rolling Quantity', required: false, kind: 'number', aliases: ['rolling qty', 'rolling quantity'] },
  { key: 'rolling_date', label: 'Rolling Date', required: false, kind: 'date', aliases: ['rolling date'] },
  { key: 'dispensed_qty', label: 'Dispensed Quantity', required: false, kind: 'number', aliases: ['dispensed', 'dispensed qty', 'dispensed quantity'] },
  { key: 'action_date', label: 'Action Date', required: false, kind: 'date', aliases: ['date', 'action date'] },
  { key: 'admin_name', label: 'Admin Name', required: false, kind: 'text', aliases: ['admin', 'admin name'] },
]

export const REQUIRED_PRODUCTION_IMPORT_FIELDS = PRODUCTION_IMPORT_FIELDS.filter((field) => field.required)

function normalizedHeader(value: RawWorkbookCell | undefined): string {
  return value === null || value === undefined
    ? ''
    : String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function suggestedField(value: RawWorkbookCell | undefined): ProductionImportField | null {
  const header = normalizedHeader(value)
  return PRODUCTION_IMPORT_FIELDS.find((field) => field.aliases.includes(header))?.key ?? null
}

function isBlank(value: RawWorkbookCell | undefined): boolean {
  return value === null || value === undefined || (typeof value === 'string' && !value.trim())
}

function textValue(value: RawWorkbookCell | undefined): string | null {
  return isBlank(value) ? null : String(value).trim()
}

function displayValue(value: RawWorkbookCell): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).trim()
}

function columnLetter(index: number): string {
  let value = index + 1
  let result = ''
  while (value > 0) {
    value -= 1
    result = String.fromCharCode(65 + (value % 26)) + result
    value = Math.floor(value / 26)
  }
  return result
}

export function detectProductionHeaderRow(rows: RawWorkbookRow[]): number {
  const candidates = rows.slice(0, MAX_HEADER_ROWS).map((row, index) => {
    const nonBlank = row.filter((cell) => !isBlank(cell))
    if (nonBlank.length < 2) return { index, score: Number.NEGATIVE_INFINITY }
    const textCells = nonBlank.filter((cell) => typeof cell === 'string' && Number.isNaN(Number(cell)))
    const aliasMatches = new Set(row.map(suggestedField).filter(Boolean)).size
    const numericCells = nonBlank.filter((cell) => typeof cell === 'number').length
    const followingRows = rows.slice(index + 1, index + 4)
    const populatedBelow = followingRows.reduce(
      (count, nextRow) => count + row.filter((_, columnIndex) => !isBlank(nextRow[columnIndex])).length,
      0,
    )
    return {
      index,
      score: aliasMatches * 10 + textCells.length * 2 + Math.min(nonBlank.length, 12) + populatedBelow * 0.25 - numericCells * 2,
    }
  })
  const best = candidates.reduce((current, candidate) => candidate.score > current.score ? candidate : current, {
    index: -1,
    score: Number.NEGATIVE_INFINITY,
  })
  if (best.index < 0) {
    throw new ProductionWorkbookError('No header row could be detected. Choose a sheet with at least two populated columns.')
  }
  return best.index + 1
}

export function getProductionSourceColumns(rows: RawWorkbookRow[], headerRow: number): ProductionSourceColumn[] {
  const headerIndex = headerRow - 1
  const header = rows[headerIndex]
  if (!header) throw new ProductionWorkbookError(`Header row ${headerRow} is outside the selected sheet.`)
  const dataRows = rows.slice(headerIndex + 1)
  const columnCount = Math.max(header.length, ...dataRows.slice(0, 100).map((row) => row.length), 0)

  return Array.from({ length: columnCount }, (_, index) => {
    const samples: string[] = []
    for (const row of dataRows) {
      const value = row[index]
      if (!isBlank(value)) {
        const sample = displayValue(value as RawWorkbookCell)
        if (!samples.includes(sample)) samples.push(sample)
      }
      if (samples.length === SAMPLE_LIMIT) break
    }
    const headerText = textValue(header[index]) ?? ''
    return {
      header: headerText,
      index,
      isBlank: !headerText && samples.length === 0,
      letter: columnLetter(index),
      samples,
    }
  })
}

export function suggestProductionColumnMapping(columns: ProductionSourceColumn[]): ProductionImportMapping {
  const mapping: ProductionImportMapping = {}
  const usedFields = new Set<ProductionImportField>()
  for (const column of columns) {
    const field = column.isBlank ? null : suggestedField(column.header)
    mapping[column.index] = field && !usedFields.has(field) ? field : null
    if (mapping[column.index]) usedFields.add(mapping[column.index] as ProductionImportField)
  }
  return mapping
}

export function getMissingRequiredMappings(mapping: ProductionImportMapping): ProductionImportFieldDefinition[] {
  const mapped = new Set(Object.values(mapping).filter((field): field is ProductionImportField => field !== null))
  return REQUIRED_PRODUCTION_IMPORT_FIELDS.filter((field) => !mapped.has(field.key))
}

function issue(sourceRow: number, field: ProductionImportField, severity: 'error' | 'warning', message: string): ProductionImportIssue {
  return { field, message, severity, sourceRow }
}

function numberValue(value: RawWorkbookCell | undefined, sourceRow: number, field: ProductionImportField, label: string, blankValue: number | null, issues: ProductionImportIssue[]): number | null {
  if (isBlank(value)) return blankValue
  const parsed = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(parsed)) {
    issues.push(issue(sourceRow, field, 'error', `${label} is not a valid number.`))
    return null
  }
  return parsed
}

function dateValue(value: RawWorkbookCell | undefined, sourceRow: number, field: ProductionImportField, label: string, issues: ProductionImportIssue[]): string | null {
  const normalized = normalizeProductionDate(value)
  if (!normalized.isValid) issues.push(issue(sourceRow, field, 'error', `${label} is not a recognized date.`))
  return normalized.value
}

function routeValue(value: RawWorkbookCell | undefined, sourceRow: number, issues: ProductionImportIssue[]): ProductionRoute {
  const route = (textValue(value) ?? '').toUpperCase().replace(/[\/_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  const knownRoutes: ProductionRoute[] = ['BEND', 'NO BEND', 'ROD', 'ROLLING', 'LADDER', 'OTHER']
  if (!route) return 'OTHER'
  if (knownRoutes.includes(route as ProductionRoute)) return route as ProductionRoute
  issues.push(issue(sourceRow, 'routing', 'error', `Route “${route}” is not recognized.`))
  return 'OTHER'
}

export function mapProductionRows(rows: RawWorkbookRow[], headerRow: number, mapping: ProductionImportMapping): NormalizedProductionSheet {
  const columns = getProductionSourceColumns(rows, headerRow)
  const mappedFields = Object.values(mapping).filter((field): field is ProductionImportField => field !== null)
  if (new Set(mappedFields).size !== mappedFields.length) {
    throw new ProductionWorkbookError('Each Production field can only be mapped once.')
  }

  const fieldColumns = new Map<ProductionImportField, number>()
  Object.entries(mapping).forEach(([index, field]) => {
    if (field) fieldColumns.set(field, Number(index))
  })
  const cell = (row: RawWorkbookRow, field: ProductionImportField) => {
    const columnIndex = fieldColumns.get(field)
    return columnIndex === undefined ? undefined : row[columnIndex]
  }

  const headerIndex = headerRow - 1
  const normalizedRows = rows.slice(headerIndex + 1).flatMap((row, offset) => {
    if (row.every(isBlank)) return []
    const sourceRow = headerIndex + offset + 2
    const issues: ProductionImportIssue[] = []
    const normalized: NormalizedProductionImportRow = {
      action_date: dateValue(cell(row, 'action_date'), sourceRow, 'action_date', 'Action Date', issues),
      admin_name: textValue(cell(row, 'admin_name')),
      article: textValue(cell(row, 'article')) ?? '',
      bend_date: dateValue(cell(row, 'bend_date'), sourceRow, 'bend_date', 'Bend Date', issues),
      bend_qty: numberValue(cell(row, 'bend_qty'), sourceRow, 'bend_qty', 'Bend Quantity', 0, issues),
      cut_date: dateValue(cell(row, 'cut_date'), sourceRow, 'cut_date', 'Cut Date', issues),
      cut_qty: numberValue(cell(row, 'cut_qty'), sourceRow, 'cut_qty', 'Cut Quantity', 0, issues),
      designation: textValue(cell(row, 'designation')),
      dispensed_qty: numberValue(cell(row, 'dispensed_qty'), sourceRow, 'dispensed_qty', 'Dispensed Quantity', 0, issues),
      material: textValue(cell(row, 'material')),
      out_bend_date: dateValue(cell(row, 'out_bend_date'), sourceRow, 'out_bend_date', 'Out Bend Date', issues),
      out_bend_qty: numberValue(cell(row, 'out_bend_qty'), sourceRow, 'out_bend_qty', 'Out Bend Quantity', 0, issues),
      profile: textValue(cell(row, 'profile')),
      remark: textValue(cell(row, 'remark')),
      rolling_date: dateValue(cell(row, 'rolling_date'), sourceRow, 'rolling_date', 'Rolling Date', issues),
      rolling_qty: numberValue(cell(row, 'rolling_qty'), sourceRow, 'rolling_qty', 'Rolling Quantity', 0, issues),
      routing: routeValue(cell(row, 'routing'), sourceRow, issues),
      source_row: sourceRow,
      total_quantity: numberValue(cell(row, 'total_quantity'), sourceRow, 'total_quantity', 'Total Quantity', null, issues),
      unit_weight_kg: numberValue(cell(row, 'unit_weight_kg'), sourceRow, 'unit_weight_kg', 'Unit Weight', null, issues),
    }
    return [{ issues, row: normalized }]
  })

  if (normalizedRows.length === 0) {
    throw new ProductionWorkbookError('No Production rows were found below the selected header row.')
  }
  const ignoredHeaders = columns.filter((column) => mapping[column.index] === null && column.header).map((column) => column.header)
  return { headerRow, ignoredHeaders, rows: normalizedRows }
}
