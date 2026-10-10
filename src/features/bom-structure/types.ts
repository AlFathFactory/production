export type BomRawValue = string | number | boolean | Date | null

export type BomRawRow = Record<string, BomRawValue>

export type BomItemType = 'assembly' | 'material' | 'part' | 'unknown'

export type BomWarningKind =
  | 'cumulative-mismatch'
  | 'empty-code'
  | 'hierarchy-jump'
  | 'invalid-level'
  | 'invalid-quantity'
  | 'invalid-weight'
  | 'multiple-roots'
  | 'negative-quantity'
  | 'no-root'
  | (string & {})

export interface BomWarning {
  code: string | null
  kind: BomWarningKind
  message: string
  sourceRow: number
}

export interface BomNode {
  articleType: string
  description?: string
  calculatedCumulativeQuantity: number
  children: BomNode[]
  code: string
  drawingNumber: string
  excelCumulativeQuantity: number | null
  formattedRaw: BomRawRow
  id: string
  isLeaf: boolean
  itemType: BomItemType
  level: number
  material: string
  name: string
  name2: string
  parentCode: string | null
  parentId: string | null
  position: string
  positionWeightKg: number | null
  quantityPerParent: number
  raw: BomRawRow
  reuseCount: number
  rolledWeightKg: number
  sourceRow: number
  sourceType: string
}

export interface BomSummary {
  assemblies: number
  leafItems: number
  levels: number
  materials: number
  parts: number
  rootCode: string
  rows: number
  totalCalculatedLeafMassKg: number
  uniqueCodes: number
}

export interface RolledUpBomPart {
  code: string
  description: string
  material: string
  totalQuantity: number
  totalWeightKg: number
  unitWeightKg: number | null
}

export interface BomParseResult {
  byCode: Map<string, BomNode[]>
  headerRow: number
  leaves: BomNode[]
  nodes: BomNode[]
  rolledUpParts: RolledUpBomPart[]
  root: BomNode | null
  roots: BomNode[]
  sheetName: string
  summary: BomSummary
  warnings: BomWarning[]
}

export const BOM_ITEM_TYPE_LABELS: Record<BomItemType, string> = {
  assembly: 'Assembly',
  material: 'Material',
  part: 'Part',
  unknown: 'Other',
}
