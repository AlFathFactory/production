import type { ProductionNextAction, ProductionProgressState, ProductionRoute } from './types'

export const productionRoutes: readonly ProductionRoute[] = [
  'BEND',
  'NO BEND',
  'ROD',
  'ROLLING',
  'LADDER',
  'OTHER',
]

export const productionNextActions: readonly ProductionNextAction[] = [
  'CUT',
  'OUT_BEND',
  'BEND',
  'ROLLING',
  'DISPENSE',
  'COMPLETE',
]

export const productionProgressStates: readonly ProductionProgressState[] = [
  'not_started',
  'in_progress',
  'completed',
]

export const progressStateLabels: Record<ProductionProgressState, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}
