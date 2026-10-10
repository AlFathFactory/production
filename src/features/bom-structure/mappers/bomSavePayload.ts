import type { Json } from '../../../types/database'
import type { BomNode, BomParseResult, BomRawRow, BomRawValue } from '../types'

export interface BomNodeSaveDto {
  source_row: number
  parent_source_row: number | null
  level: number
  code: string | null
  position: string | null
  article_type: string | null
  source_type: string | null
  name: string | null
  name2: string | null
  description: string | null
  drawing_number: string | null
  material: string | null
  quantity_per_parent: number
  calculated_cumulative_quantity: number
  excel_cumulative_quantity: number | null
  position_weight_kg: number | null
  rolled_weight_kg: number
  raw_data: Record<string, Json>
  formatted_raw_data: Record<string, Json>
  item_type: BomNode['itemType']
}

function nullableText(value: string): string | null {
  return value.trim() || null
}

function finite(value: number, field: string, sourceRow: number): number {
  if (!Number.isFinite(value)) throw new Error(`Excel row ${sourceRow} has an invalid ${field}.`)
  return value
}

function rawValue(value: BomRawValue): Json {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return value.toISOString()
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return null
  return value
}

function rawRow(row: BomRawRow): Record<string, Json> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, rawValue(value)]))
}

export function buildBomNodeSavePayload(result: BomParseResult): BomNodeSaveDto[] {
  const rowsById = new Map(result.nodes.map((node) => [node.id, node.sourceRow]))
  const sourceRows = new Set<number>()

  return result.nodes.map((node) => {
    if (!Number.isInteger(node.sourceRow) || node.sourceRow < 1 || sourceRows.has(node.sourceRow)) {
      throw new Error(`Invalid or duplicate Excel source row ${node.sourceRow}.`)
    }
    sourceRows.add(node.sourceRow)
    const parentSourceRow = node.parentId ? rowsById.get(node.parentId) : null
    if (node.parentId && parentSourceRow === undefined) {
      throw new Error(`Excel row ${node.sourceRow} refers to a parent outside this workbook.`)
    }

    return {
      source_row: node.sourceRow,
      parent_source_row: parentSourceRow ?? null,
      level: finite(node.level, 'level', node.sourceRow),
      code: nullableText(node.code),
      position: nullableText(node.position),
      article_type: nullableText(node.articleType),
      source_type: nullableText(node.sourceType),
      name: nullableText(node.name),
      name2: nullableText(node.name2),
      description: nullableText([node.name, node.name2].filter(Boolean).join(' ')),
      drawing_number: nullableText(node.drawingNumber),
      material: nullableText(node.material),
      quantity_per_parent: finite(node.quantityPerParent, 'quantity', node.sourceRow),
      calculated_cumulative_quantity: finite(node.calculatedCumulativeQuantity, 'cumulative quantity', node.sourceRow),
      excel_cumulative_quantity: node.excelCumulativeQuantity === null ? null : finite(node.excelCumulativeQuantity, 'Excel cumulative quantity', node.sourceRow),
      position_weight_kg: node.positionWeightKg === null ? null : finite(node.positionWeightKg, 'position weight', node.sourceRow),
      rolled_weight_kg: finite(node.rolledWeightKg, 'rolled weight', node.sourceRow),
      raw_data: rawRow(node.raw),
      formatted_raw_data: rawRow(node.formattedRaw),
      item_type: node.itemType,
    }
  })
}
