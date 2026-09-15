import type { DirectStageAction, ProductionSearchRow } from './types'

function isPositive(value: number | null): value is number {
  return value !== null && value > 0
}

export function getAvailableDirectStageActions(item: ProductionSearchRow): DirectStageAction[] {
  if (item.next_action === 'COMPLETE' || (item.completion_percent ?? 0) >= 100) {
    return []
  }

  const actions: DirectStageAction[] = []

  if (isPositive(item.remaining_cut)) {
    actions.push({ stage: 'CUT', availableQuantity: item.remaining_cut })
  }

  if (item.routing === 'ROLLING' && isPositive(item.remaining_rolling)) {
    actions.push({ stage: 'ROLLING', availableQuantity: item.remaining_rolling })
  }

  if (isPositive(item.warehouse_stock)) {
    actions.push({ stage: 'DISPENSE', availableQuantity: item.warehouse_stock })
  }

  return actions
}
