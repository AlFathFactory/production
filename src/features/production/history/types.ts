import type { Database } from '../../../types/database'

export type ProductionStage = Database['public']['Enums']['production_stage']
export type ProductionStageSource = 'manual' | 'excel_import' | 'document'

export interface ProductionStageEntry {
  id: string
  productionItemId: string
  stage: ProductionStage
  quantity: number
  entryDate: string
  note: string | null
  source: ProductionStageSource
  sourceReference: string | null
  createdAt: string
  createdBy: string | null
  performedBy: string | null
  performedByName: string | null
}

export interface ProductionStageEntryAudit {
  id: string
  stageEntryId: string
  action: 'corrected' | 'deleted'
  reason: string
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
  correctedBy: string | null
  correctedByName: string | null
  correctedAt: string
}

export interface CorrectProductionStageEntryInput {
  entryId: string
  quantity: number
  entryDate: string
  note: string
  reason: string
}

export interface DeleteProductionStageEntryInput {
  entryId: string
  reason: string
}

export interface ProductionHistoryFilters {
  productionItemId: string
}