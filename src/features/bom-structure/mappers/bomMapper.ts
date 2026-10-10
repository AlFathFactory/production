import type { Json } from '../../../types/database'
import type { BomNode, BomRawRow, BomRawValue } from '../types'
import type {
  BomDimensionMappingRow,
  BomDimensionMappingLookupRow,
  BomImportRow,
  BomNodeRow,
  BomExtractionCandidateRow,
  BomReuseRow,
  BomRolledUpLeafRow,
  BomSummaryRow,
  BomTreeNodeRow,
  BomWarningRow,
} from '../types/bomBackend.types'
import type {
  BomDimensionMapping,
  BomExtractionCandidate,
  BomImport,
  BomReuseCount,
  PersistedBomNode,
  PersistedBomSummary,
  PersistedRolledUpBomPart,
  PersistedBomWarning,
} from '../types/bomDomain.types'

function nullableText(value: string | null): string {
  return value ?? ''
}

function toDate(value: string | null): Date | null {
  return value ? new Date(value) : null
}

function toRawValue(value: Json | undefined): BomRawValue | null {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null
    ? value
    : null
}

function toRawRow(value: Json): BomRawRow {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) => {
      const rawValue = toRawValue(entry)
      return rawValue === null && entry !== null ? [] : [[key, rawValue]]
    }),
  )
}

function toItemType(value: string): PersistedBomNode['itemType'] {
  return value === 'assembly' || value === 'material' || value === 'part' ? value : 'unknown'
}

export function mapBomImport(row: BomImportRow): BomImport {
  return {
    id: row.id,
    fileName: row.file_name,
    status: row.status,
    projectId: row.project_id,
    projectNumberId: row.project_number_id,
    lotId: row.lot_id,
    sheetName: row.sheet_name,
    headerRow: row.header_row,
    rootCode: row.root_code,
    parserVersion: row.parser_version,
    sourceFileName: row.source_file_name,
    sourceFileBucket: row.source_file_bucket,
    sourceFilePath: row.source_file_path,
    sourceFileMimeType: row.source_file_mime_type,
    sourceFileSizeBytes: row.source_file_size_bytes,
    sourceFileSha256: row.source_file_sha256,
    versionGroupId: row.version_group_id,
    versionNumber: row.version_number,
    supersedesImportId: row.supersedes_import_id,
    supersededByImportId: row.superseded_by_import_id,
    activatedAt: toDate(row.activated_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function mapBomNode(row: BomNodeRow): PersistedBomNode {
  return {
    id: row.id,
    importId: row.bom_import_id,
    parentId: row.parent_id,
    sourceRow: row.source_row,
    level: row.level,
    code: nullableText(row.code),
    parentCode: row.parent_code,
    position: nullableText(row.position),
    articleType: nullableText(row.article_type),
    itemType: toItemType(row.item_type),
    sourceType: nullableText(row.source_type),
    name: nullableText(row.name),
    name2: nullableText(row.name2),
    description: nullableText(row.description),
    drawingNumber: nullableText(row.drawing_number),
    material: nullableText(row.material),
    quantityPerParent: Number(row.quantity_per_parent),
    calculatedCumulativeQuantity: Number(row.calculated_cumulative_quantity),
    excelCumulativeQuantity: row.excel_cumulative_quantity === null ? null : Number(row.excel_cumulative_quantity),
    positionWeightKg: row.position_weight_kg === null ? null : Number(row.position_weight_kg),
    rolledWeightKg: Number(row.rolled_weight_kg),
    raw: toRawRow(row.raw_data),
    formattedRaw: toRawRow(row.formatted_raw_data),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  }
}

export function mapBomTree(rows: BomTreeNodeRow[], reuseRows: BomReuseRow[]): { nodes: BomNode[]; roots: BomNode[] } {
  const nodes: BomNode[] = rows.map((row) => {
    const node = mapBomNode({
      ...row,
      raw_data: {},
      formatted_raw_data: {},
      created_at: '',
      updated_at: '',
    })
    return {
      ...node,
      children: [],
      isLeaf: true,
      reuseCount: 0,
    }
  })
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const reuseCounts = new Map(reuseRows.map((row) => [row.code, Number(row.reuse_count ?? 0)]))

  for (const node of nodes) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined
    if (parent) {
      parent.children.push(node)
      parent.isLeaf = false
    }
  }

  for (const node of nodes) node.reuseCount = reuseCounts.get(node.code) ?? 0

  return { nodes, roots: nodes.filter((node) => !node.parentId || !byId.has(node.parentId)) }
}

export function mapBomWarning(row: BomWarningRow): PersistedBomWarning {
  const details = typeof row.details === 'object' && row.details !== null && !Array.isArray(row.details)
    ? row.details
    : {}

  return {
    id: row.id,
    importId: row.bom_import_id,
    warningIndex: row.warning_index,
    code: typeof details.code === 'string' ? details.code : null,
    kind: row.kind,
    message: row.message,
    sourceRow: row.source_row ?? 0,
    details,
    createdAt: new Date(row.created_at),
  }
}

export function mapBomDimensionMapping(row: BomDimensionMappingRow | BomDimensionMappingLookupRow): BomDimensionMapping {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    tokenIndex: row.token_index,
    tokenRaw: row.token_raw,
    tokenValue: row.token_value === null ? null : Number(row.token_value),
    role: row.role,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function numberOrZero(value: number | null): number {
  return value === null ? 0 : Number(value)
}

export function mapBomSummary(row: BomSummaryRow): PersistedBomSummary {
  return {
    rootCode: row.root_code ?? '',
    rows: numberOrZero(row.rows),
    levels: numberOrZero(row.levels),
    uniqueCodes: numberOrZero(row.unique_codes),
    assemblies: numberOrZero(row.assemblies),
    parts: numberOrZero(row.parts),
    materials: numberOrZero(row.materials),
    leafItems: numberOrZero(row.leaf_items),
    totalCalculatedLeafMassKg: numberOrZero(row.total_calculated_leaf_mass_kg),
  }
}

export function mapBomReuseCount(row: BomReuseRow): BomReuseCount {
  return {
    importId: row.bom_import_id,
    code: row.code,
    reuseCount: numberOrZero(row.reuse_count),
    isReused: row.is_reused ?? false,
  }
}

export function mapRolledUpBomPart(row: BomRolledUpLeafRow): PersistedRolledUpBomPart {
  return {
    code: row.code ?? '',
    description: row.description ?? '',
    material: row.material ?? '',
    totalQuantity: numberOrZero(row.total_quantity),
    totalWeightKg: numberOrZero(row.total_weight_kg),
    unitWeightKg: row.unit_weight_kg === null ? null : Number(row.unit_weight_kg),
  }
}

export function mapBomExtractionCandidate(row: BomExtractionCandidateRow): BomExtractionCandidate {
  return {
    importId: row.bom_import_id,
    versionGroupId: row.version_group_id,
    versionNumber: row.version_number,
    lotId: row.lot_id,
    representativeNodeId: row.representative_node_id,
    article: row.article,
    name: row.name,
    name2: row.name2,
    designation: row.designation,
    material: row.material,
    sourceType: row.source_type,
    drawingNumber: row.drawing_number,
    occurrenceCount: numberOrZero(row.occurrence_count),
    totalQuantity: row.total_quantity === null ? null : Number(row.total_quantity),
    unitWeightKg: row.unit_weight_kg === null ? null : Number(row.unit_weight_kg),
    totalWeightKg: row.total_weight_kg === null ? null : Number(row.total_weight_kg),
    profile: row.profile,
    lengthValue: row.length_value === null ? null : Number(row.length_value),
    widthValue: row.width_value === null ? null : Number(row.width_value),
    heightValue: row.height_value === null ? null : Number(row.height_value),
    requiresRoutingAssignment: row.requires_routing_assignment ?? false,
    blockers: row.blockers,
    isReadyForProduction: row.is_ready_for_production ?? false,
  }
}
