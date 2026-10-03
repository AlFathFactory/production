import type { ProductionRoute } from '../types'

export type RawWorkbookCell = string | number | boolean | Date | null
export type RawWorkbookRow = RawWorkbookCell[]

export interface ParsedProductionWorkbook {
  sheetNames: string[]
  sheets: Record<string, RawWorkbookRow[]>
}

export type ProductionImportField =
  | 'action_date'
  | 'admin_name'
  | 'article'
  | 'bend_date'
  | 'bend_qty'
  | 'cut_qty'
  | 'cut_date'
  | 'out_bend_qty'
  | 'out_bend_date'
  | 'designation'
  | 'dispensed_qty'
  | 'material'
  | 'profile'
  | 'remark'
  | 'rolling_date'
  | 'rolling_qty'
  | 'routing'
  | 'total_quantity'
  | 'unit_weight_kg'

export type ProductionImportMapping = Record<number, ProductionImportField | null>

export type ProductionImportValueKind = 'date' | 'number' | 'route' | 'text'

export interface ProductionImportFieldDefinition {
  aliases: readonly string[]
  key: ProductionImportField
  kind: ProductionImportValueKind
  label: string
  required: boolean
}

export interface ProductionSourceColumn {
  header: string
  index: number
  isBlank: boolean
  letter: string
  samples: string[]
}

export interface ProductionImportIssue {
  actualValue?: number | string | null
  code?: string
  field?: ProductionImportField
  maximumValue?: number | null
  message: string
  origin?: 'backend' | 'local'
  severity: 'error' | 'warning'
  sourceRow: number
  stage?: string | null
  values?: ProductionQuantityValues
}

export interface ProductionQuantityValues {
  bend_qty: number | null
  cut_qty: number | null
  dispensed_qty: number | null
  out_bend_qty: number | null
  rolling_qty: number | null
  total_quantity: number | null
}

export interface NormalizedProductionImportRow {
  action_date: string | null
  admin_name: string | null
  article: string
  bend_date: string | null
  bend_qty: number | null
  cut_date: string | null
  cut_qty: number | null
  designation: string | null
  dispensed_qty: number | null
  material: string | null
  out_bend_date: string | null
  out_bend_qty: number | null
  profile: string | null
  remark: string | null
  rolling_date: string | null
  rolling_qty: number | null
  routing: ProductionRoute
  source_row: number
  total_quantity: number | null
  unit_weight_kg: number | null
}

export type ProductionImportPayloadRow = {
  action_date: string | null
  admin_name: string | null
  article: string
  bend_date: string | null
  bend_qty: number
  cut_date: string | null
  cut_qty: number
  designation: string | null
  dispensed_qty: number
  material: string | null
  out_bend_date: string | null
  out_bend_qty: number
  profile: string | null
  remark: string | null
  rolling_date: string | null
  rolling_qty: number
  routing: ProductionRoute
  source_row: number
  total_quantity: number
  unit_weight_kg: number | null
}

export interface NormalizedProductionSheet {
  headerRow: number
  ignoredHeaders: string[]
  rows: Array<{
    issues: ProductionImportIssue[]
    row: NormalizedProductionImportRow
  }>
}

export interface ProductionImportPreviewRow {
  changedFields: ProductionImportField[]
  errors: ProductionImportIssue[]
  originalRow: NormalizedProductionImportRow
  row: NormalizedProductionImportRow
  warnings: ProductionImportIssue[]
}

export interface ProductionImportPreview {
  errorRows: number
  headerRow: number
  ignoredHeaders: string[]
  payload: ProductionImportPayloadRow[] | null
  rows: ProductionImportPreviewRow[]
  totalRows: number
  validRows: number
  warningCount: number
}

export type ProductionImportValidationStatus = 'not-run' | 'pending' | 'passed' | 'failed'

export interface ProductionBackendValidationError {
  actualValue: number | string | null
  article: string | null
  errorCode: string
  field?: ProductionImportField
  maximumValue: number | null
  message: string
  routing: string | null
  sourceRow: number
  stage: string | null
  values: ProductionQuantityValues
}

export interface ProductionBackendValidationResult {
  errors: ProductionBackendValidationError[]
  invalidRows: number
  totalRows: number
  valid: boolean
  validRows: number
}

export interface ProductionImportResult {
  importId: string
  itemsInserted: number
  itemsUpdated: number
  rowsProcessed: number
  skippedRows: number
  stageEntriesCreated: number
}

export interface ImportProductionFileInput {
  fileName: string
  lotId: string
  rows: ProductionImportPayloadRow[]
}

export interface ValidateProductionRowsInput {
  lotId: string
  rows: ProductionImportPayloadRow[]
}
