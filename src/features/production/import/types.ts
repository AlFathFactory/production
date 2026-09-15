import type { ProductionRoute } from '../types'

export type RawWorkbookCell = string | number | boolean | Date | null
export type RawWorkbookRow = RawWorkbookCell[]

export interface ParsedProductionWorkbook {
  sheetNames: string[]
  sheets: Record<string, RawWorkbookRow[]>
}

export type ProductionImportField =
  | 'article'
  | 'unit_weight_kg'
  | 'total_quantity'
  | 'cut_qty'
  | 'cut_date'
  | 'out_bend_qty'
  | 'out_bend_date'
  | 'bend_qty'
  | 'bend_date'
  | 'rolling_qty'
  | 'rolling_date'
  | 'dispensed_qty'
  | 'action_date'
  | 'routing'

export interface ProductionImportIssue {
  field?: ProductionImportField
  message: string
  severity: 'error' | 'warning'
  sourceRow: number
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
  errors: ProductionImportIssue[]
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
