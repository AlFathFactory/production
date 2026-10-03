import type {
  NormalizedProductionImportRow,
  NormalizedProductionSheet,
  ProductionBackendValidationResult,
  ProductionImportField,
  ProductionImportIssue,
  ProductionImportPayloadRow,
  ProductionImportPreview,
  ProductionQuantityValues,
} from './types'

const EDITABLE_FIELDS: readonly ProductionImportField[] = [
  'article', 'profile', 'routing', 'designation', 'material', 'total_quantity',
  'unit_weight_kg', 'cut_qty', 'cut_date', 'out_bend_qty', 'out_bend_date',
  'bend_qty', 'bend_date', 'rolling_qty', 'rolling_date', 'dispensed_qty',
  'action_date', 'remark', 'admin_name',
]

function hasIssue(issues: ProductionImportIssue[], field: ProductionImportField): boolean {
  return issues.some((issue) => issue.field === field)
}

function rowIssue(
  row: NormalizedProductionImportRow,
  field: ProductionImportField,
  severity: 'error' | 'warning',
  message: string,
  details: Partial<ProductionImportIssue> = {},
): ProductionImportIssue {
  return {
    field,
    message,
    origin: 'local',
    severity,
    sourceRow: row.source_row,
    values: quantityValues(row),
    ...details,
  }
}

function quantityValues(row: NormalizedProductionImportRow): ProductionQuantityValues {
  return {
    bend_qty: row.bend_qty,
    cut_qty: row.cut_qty,
    dispensed_qty: row.dispensed_qty,
    out_bend_qty: row.out_bend_qty,
    rolling_qty: row.rolling_qty,
    total_quantity: row.total_quantity,
  }
}

function addQuantityRules(row: NormalizedProductionImportRow, issues: ProductionImportIssue[]) {
  const negativeFields = [
    ['total_quantity', 'Total Quantity', row.total_quantity, 'NEGATIVE_TOTAL_QUANTITY'],
    ['cut_qty', 'CUT quantity', row.cut_qty, 'NEGATIVE_CUT_QUANTITY'],
    ['out_bend_qty', 'Issue Packing quantity', row.out_bend_qty, 'NEGATIVE_OUT_BEND_QUANTITY'],
    ['bend_qty', 'Receive Packing quantity', row.bend_qty, 'NEGATIVE_BEND_QUANTITY'],
    ['rolling_qty', 'Rolling quantity', row.rolling_qty, 'NEGATIVE_ROLLING_QUANTITY'],
    ['dispensed_qty', 'Dispensed quantity', row.dispensed_qty, 'NEGATIVE_DISPENSED_QUANTITY'],
  ] as const

  for (const [field, label, value, code] of negativeFields) {
    if (value !== null && value < 0) {
      issues.push(rowIssue(row, field, 'error', `${label} cannot be negative.`, { actualValue: value, code }))
    }
  }

  if (row.unit_weight_kg !== null && row.unit_weight_kg < 0) {
    issues.push(rowIssue(row, 'unit_weight_kg', 'error', 'Unit Weight cannot be negative.', {
      actualValue: row.unit_weight_kg,
      code: 'NEGATIVE_UNIT_WEIGHT',
    }))
  }

  if (row.cut_qty !== null && row.total_quantity !== null
    && row.cut_qty >= 0 && row.total_quantity >= 0 && row.cut_qty > row.total_quantity) {
    issues.push(rowIssue(row, 'cut_qty', 'error', `CUT quantity exceeds Total Quantity by ${row.cut_qty - row.total_quantity}.`, {
      actualValue: row.cut_qty,
      code: 'CUT_EXCEEDS_TOTAL',
      maximumValue: row.total_quantity,
      stage: 'CUT',
    }))
  }
  if (row.out_bend_qty !== null && row.cut_qty !== null
    && row.out_bend_qty >= 0 && row.cut_qty >= 0 && row.out_bend_qty > row.cut_qty) {
    issues.push(rowIssue(row, 'out_bend_qty', 'error', `Issue Packing quantity exceeds CUT quantity by ${row.out_bend_qty - row.cut_qty}.`, {
      actualValue: row.out_bend_qty,
      code: 'OUT_BEND_EXCEEDS_CUT',
      maximumValue: row.cut_qty,
      stage: 'OUT_BEND',
    }))
  }
  if (row.bend_qty !== null && row.out_bend_qty !== null
    && row.bend_qty >= 0 && row.out_bend_qty >= 0 && row.bend_qty > row.out_bend_qty) {
    issues.push(rowIssue(row, 'bend_qty', 'error', `Receive Packing quantity exceeds Issue Packing quantity by ${row.bend_qty - row.out_bend_qty}.`, {
      actualValue: row.bend_qty,
      code: 'BEND_EXCEEDS_OUT_BEND',
      maximumValue: row.out_bend_qty,
      stage: 'BEND',
    }))
  }
  if (row.rolling_qty !== null && row.cut_qty !== null
    && row.rolling_qty >= 0 && row.cut_qty >= 0 && row.rolling_qty > row.cut_qty) {
    issues.push(rowIssue(row, 'rolling_qty', 'error', `Rolling quantity exceeds CUT quantity by ${row.rolling_qty - row.cut_qty}.`, {
      actualValue: row.rolling_qty,
      code: 'ROLLING_EXCEEDS_CUT',
      maximumValue: row.cut_qty,
      stage: 'ROLLING',
    }))
  }

  if (row.routing !== 'BEND' && (row.out_bend_qty ?? 0) > 0) {
    issues.push(rowIssue(row, 'out_bend_qty', 'error', `Issue Packing is not valid for ${row.routing} route.`, {
      actualValue: row.out_bend_qty,
      code: 'OUT_BEND_NOT_ALLOWED_FOR_ROUTE',
      maximumValue: 0,
      stage: 'OUT_BEND',
    }))
  }
  if (row.routing !== 'BEND' && (row.bend_qty ?? 0) > 0) {
    issues.push(rowIssue(row, 'bend_qty', 'error', `Receive Packing is not valid for ${row.routing} route.`, {
      actualValue: row.bend_qty,
      code: 'BEND_NOT_ALLOWED_FOR_ROUTE',
      maximumValue: 0,
      stage: 'BEND',
    }))
  }
  if (row.routing !== 'ROLLING' && (row.rolling_qty ?? 0) > 0) {
    issues.push(rowIssue(row, 'rolling_qty', 'error', `Rolling is not valid for ${row.routing} route.`, {
      actualValue: row.rolling_qty,
      code: 'ROLLING_NOT_ALLOWED_FOR_ROUTE',
      maximumValue: 0,
      stage: 'ROLLING',
    }))
  }

  const available = row.routing === 'BEND'
    ? row.bend_qty
    : row.routing === 'ROLLING'
      ? row.rolling_qty
      : row.cut_qty
  const stockLabel = row.routing === 'BEND'
    ? 'available Receive Packing stock'
    : row.routing === 'ROLLING'
      ? 'available rolled stock'
      : 'available CUT stock'

  if (row.dispensed_qty !== null && available !== null
    && row.dispensed_qty >= 0 && available >= 0 && row.dispensed_qty > available) {
    issues.push(rowIssue(row, 'dispensed_qty', 'error', `Dispensed quantity exceeds ${stockLabel} by ${row.dispensed_qty - available}.`, {
      actualValue: row.dispensed_qty,
      code: 'DISPENSE_EXCEEDS_AVAILABLE_STOCK',
      maximumValue: available,
      stage: 'DISPENSE',
    }))
  }
}

function toPayload(row: NormalizedProductionImportRow): ProductionImportPayloadRow | null {
  if (
    row.total_quantity === null
    || row.cut_qty === null
    || row.out_bend_qty === null
    || row.bend_qty === null
    || row.rolling_qty === null
    || row.dispensed_qty === null
  ) {
    return null
  }

  return {
    action_date: row.action_date,
    admin_name: row.admin_name,
    article: row.article,
    bend_date: row.bend_date,
    bend_qty: row.bend_qty,
    cut_date: row.cut_date,
    cut_qty: row.cut_qty,
    designation: row.designation,
    dispensed_qty: row.dispensed_qty,
    material: row.material,
    out_bend_date: row.out_bend_date,
    out_bend_qty: row.out_bend_qty,
    profile: row.profile,
    remark: row.remark,
    rolling_date: row.rolling_date,
    rolling_qty: row.rolling_qty,
    routing: row.routing,
    source_row: row.source_row,
    total_quantity: row.total_quantity,
    unit_weight_kg: row.unit_weight_kg,
  }
}

function changedFields(row: NormalizedProductionImportRow, original: NormalizedProductionImportRow): ProductionImportField[] {
  return EDITABLE_FIELDS.filter((field) => row[field] !== original[field])
}

export function validateProductionRows(
  sheet: NormalizedProductionSheet,
  originalRows: ReadonlyMap<number, NormalizedProductionImportRow> = new Map(),
): ProductionImportPreview {
  const previewRows = sheet.rows.map(({ issues: normalizationIssues, row }) => {
    const issues: ProductionImportIssue[] = normalizationIssues.map((issue) => ({
      ...issue,
      origin: issue.origin ?? 'local',
    }))

    if (!row.article && !hasIssue(issues, 'article')) {
      issues.push(rowIssue(row, 'article', 'error', 'Article is required.', { code: 'ARTICLE_REQUIRED' }))
    }
    if (row.total_quantity === null && !hasIssue(issues, 'total_quantity')) {
      issues.push(rowIssue(row, 'total_quantity', 'error', 'Total Quantity is required.', { code: 'TOTAL_QUANTITY_REQUIRED' }))
    }

    addQuantityRules(row, issues)
    const originalRow = originalRows.get(row.source_row) ?? row

    return {
      changedFields: changedFields(row, originalRow),
      errors: issues.filter((issue) => issue.severity === 'error'),
      originalRow,
      row,
      warnings: issues.filter((issue) => issue.severity === 'warning'),
    }
  })

  const errorRows = previewRows.filter((previewRow) => previewRow.errors.length > 0).length
  const payloadRows = previewRows.map((previewRow) => toPayload(previewRow.row))
  const hasCompletePayload = payloadRows.every((row): row is ProductionImportPayloadRow => row !== null)

  return {
    errorRows,
    headerRow: sheet.headerRow,
    ignoredHeaders: sheet.ignoredHeaders,
    payload: errorRows === 0 && hasCompletePayload ? payloadRows : null,
    rows: previewRows,
    totalRows: previewRows.length,
    validRows: previewRows.length - errorRows,
    warningCount: sheet.ignoredHeaders.length + previewRows.reduce((count, row) => count + row.warnings.length, 0),
  }
}

export function applyBackendValidation(
  preview: ProductionImportPreview,
  validation: ProductionBackendValidationResult,
): ProductionImportPreview {
  const rows = preview.rows.map((previewRow) => {
    const backendErrors = validation.errors
      .filter((error) => error.sourceRow === previewRow.row.source_row)
      .filter((error) => !previewRow.errors.some((issue) => issue.code === error.errorCode))
      .map((error): ProductionImportIssue => ({
        actualValue: error.actualValue,
        code: error.errorCode,
        field: error.field,
        maximumValue: error.maximumValue,
        message: error.message,
        origin: 'backend',
        severity: 'error',
        sourceRow: error.sourceRow,
        stage: error.stage,
        values: error.values,
      }))
    return { ...previewRow, errors: [...previewRow.errors, ...backendErrors] }
  })
  const errorRows = rows.filter((row) => row.errors.length > 0).length

  return {
    ...preview,
    errorRows,
    payload: errorRows === 0 && validation.valid ? preview.payload : null,
    rows,
    validRows: rows.length - errorRows,
  }
}
