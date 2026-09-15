import type {
  NormalizedProductionImportRow,
  NormalizedProductionSheet,
  ProductionImportField,
  ProductionImportIssue,
  ProductionImportPayloadRow,
  ProductionImportPreview,
} from './types'

function hasIssue(issues: ProductionImportIssue[], field: ProductionImportField): boolean {
  return issues.some((issue) => issue.field === field)
}

function rowIssue(
  row: NormalizedProductionImportRow,
  field: ProductionImportField,
  severity: 'error' | 'warning',
  message: string,
): ProductionImportIssue {
  return { field, message, severity, sourceRow: row.source_row }
}

function routeWarnings(row: NormalizedProductionImportRow): ProductionImportIssue[] {
  const warnings: ProductionImportIssue[] = []

  if (row.routing === 'BEND' && (row.rolling_qty ?? 0) > 0) {
    warnings.push(rowIssue(row, 'rolling_qty', 'warning', 'BEND route contains a Rolling quantity.'))
  }

  if (row.routing === 'ROLLING' && ((row.out_bend_qty ?? 0) > 0 || (row.bend_qty ?? 0) > 0)) {
    warnings.push(rowIssue(row, 'routing', 'warning', 'ROLLING route contains Out Bend or Bend quantities.'))
  }

  if (row.routing !== 'BEND' && row.routing !== 'ROLLING'
    && ((row.out_bend_qty ?? 0) > 0 || (row.bend_qty ?? 0) > 0 || (row.rolling_qty ?? 0) > 0)) {
    warnings.push(rowIssue(row, 'routing', 'warning', `${row.routing} route contains Bend or Rolling stage quantities.`))
  }

  return warnings
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

export function validateProductionRows(sheet: NormalizedProductionSheet): ProductionImportPreview {
  const previewRows = sheet.rows.map(({ issues: normalizationIssues, row }) => {
    const issues = [...normalizationIssues]

    if (!row.article && !hasIssue(issues, 'article')) {
      issues.push(rowIssue(row, 'article', 'error', 'Component Article is required.'))
    }
    if (row.total_quantity === null && !hasIssue(issues, 'total_quantity')) {
      issues.push(rowIssue(row, 'total_quantity', 'error', 'T. QTY is required.'))
    }
    if (row.total_quantity !== null && row.total_quantity < 0) {
      issues.push(rowIssue(row, 'total_quantity', 'error', 'T. QTY cannot be negative.'))
    }
    if (row.unit_weight_kg !== null && row.unit_weight_kg < 0) {
      issues.push(rowIssue(row, 'unit_weight_kg', 'error', 'Unit Weight cannot be negative.'))
    }

    const stageQuantities = [
      ['cut_qty', 'CUT QTY', row.cut_qty],
      ['out_bend_qty', 'Out Bend QTY', row.out_bend_qty],
      ['bend_qty', 'Bend Qty', row.bend_qty],
      ['rolling_qty', 'Rolling QTY', row.rolling_qty],
      ['dispensed_qty', 'Dispensed', row.dispensed_qty],
    ] as const

    for (const [field, label, value] of stageQuantities) {
      if (value !== null && value < 0) {
        issues.push(rowIssue(row, field, 'error', `${label} cannot be negative.`))
      }
    }

    issues.push(...routeWarnings(row))

    return {
      errors: issues.filter((issue) => issue.severity === 'error'),
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
