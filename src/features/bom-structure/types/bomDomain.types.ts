import type { BomItemType, BomRawRow, BomSummary, BomWarning, RolledUpBomPart } from '../types'
import type { Json } from '../../../types/database'
import type { BomDimensionRole, BomImportStatus } from './bomBackend.types'

export interface BomImport {
  id: string
  createdBy: string
  createdByName: string | null
  fileName: string
  status: BomImportStatus
  projectId: string | null
  projectNumberId: string | null
  lotId: string | null
  sheetName: string | null
  headerRow: number | null
  rootCode: string | null
  parserVersion: string | null
  sourceFileName: string | null
  sourceFileBucket: string | null
  sourceFilePath: string | null
  sourceFileMimeType: string | null
  sourceFileSizeBytes: number | null
  sourceFileSha256: string | null
  versionGroupId: string
  versionNumber: number
  supersedesImportId: string | null
  supersededByImportId: string | null
  activatedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface PersistedBomNode {
  id: string
  importId: string
  parentId: string | null
  sourceRow: number
  level: number
  code: string
  parentCode: string | null
  position: string
  articleType: string
  itemType: BomItemType
  sourceType: string
  name: string
  name2: string
  description: string
  drawingNumber: string
  material: string
  quantityPerParent: number
  calculatedCumulativeQuantity: number
  excelCumulativeQuantity: number | null
  positionWeightKg: number | null
  rolledWeightKg: number
  raw: BomRawRow
  formattedRaw: BomRawRow
  createdAt: Date | null
  updatedAt: Date | null
}

export interface PersistedBomWarning extends BomWarning {
  id: string
  importId: string
  warningIndex: number
  details: Record<string, unknown>
  createdAt: Date
}

export interface BomDimensionMapping {
  id: string
  code: string | null
  description: string
  tokenIndex: number
  tokenRaw: string
  tokenValue: number | null
  role: BomDimensionRole
  matchScope: string | null
  createdAt: Date
  updatedAt: Date
}

export interface BomDimensionSaveResult {
  status: 'saved' | 'already_saved'
  code: string | null
  description: string
  savedCount: number
}

export type PersistedBomSummary = BomSummary
export type PersistedRolledUpBomPart = RolledUpBomPart

export interface BomReuseCount {
  importId: string | null
  code: string | null
  reuseCount: number
  isReused: boolean
}

export interface BomExtractionCandidate {
  importId: string | null
  versionGroupId: string | null
  versionNumber: number | null
  lotId: string | null
  representativeNodeId: string | null
  article: string | null
  name: string | null
  name2: string | null
  designation: string | null
  material: string | null
  sourceType: string | null
  drawingNumber: string | null
  occurrenceCount: number
  totalQuantity: number | null
  unitWeightKg: number | null
  totalWeightKg: number | null
  profile: string | null
  lengthValue: number | null
  widthValue: number | null
  heightValue: number | null
  requiresRoutingAssignment: boolean
  blockers: Json | null
  isReadyForProduction: boolean
}
