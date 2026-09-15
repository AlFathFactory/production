import type { Database } from '../../types/database'

export type ProductionRoute = Database['public']['Enums']['production_route']
export type ProductionSearchRow = Database['public']['Functions']['search_production_items']['Returns'][number]
export type ProductionNextAction = 'CUT' | 'OUT_BEND' | 'BEND' | 'ROLLING' | 'DISPENSE' | 'COMPLETE'
export type ProductionProgressState = 'not_started' | 'in_progress' | 'completed'
export type DirectProductionStage = 'CUT' | 'ROLLING' | 'DISPENSE'

export interface CreateProductionItemInput {
  article: string
  createdBy: string
  designation: string
  lotId: string
  material: string
  profile: string
  remark: string
  routing: ProductionRoute
  totalQuantity: number
  unitWeightKg: number | null
}

export interface CreateProductionItemFormValues {
  article: string
  designation: string
  material: string
  profile: string
  remark: string
  routing: ProductionRoute | null
  totalQuantity: string
  unitWeightKg: string
}

export interface AddProductionStageEntryInput {
  entryDate: string
  note: string
  productionItemId: string
  quantity: number
  stage: DirectProductionStage
}

export interface DirectStageAction {
  availableQuantity: number
  stage: DirectProductionStage
}

export interface ProductionFilters {
  projectId: string | null
  projectNumberId: string | null
  lotId: string | null
  query: string
  route: ProductionRoute | null
  nextAction: ProductionNextAction | null
  progressState: ProductionProgressState | null
}
