import type { Database } from '../../types/database'

export type ProductionRoute = Database['public']['Enums']['production_route']
export type ProductionSearchRow = Database['public']['Functions']['search_production_items']['Returns'][number]
export type ProductionNextAction = 'CUT' | 'OUT_BEND' | 'BEND' | 'ROLLING' | 'DISPENSE' | 'COMPLETE'
export type ProductionProgressState = 'not_started' | 'in_progress' | 'completed'

export interface ProductionFilters {
  projectId: string | null
  projectNumberId: string | null
  lotId: string | null
  query: string
  route: ProductionRoute | null
  nextAction: ProductionNextAction | null
  progressState: ProductionProgressState | null
}
