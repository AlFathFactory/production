import type { Database } from '../../types/database'

export type LotDashboardRow = Database['public']['Views']['production_lot_dashboard']['Row']
export type ActionQueueRow = Database['public']['Views']['production_action_queue']['Row']

export interface DashboardFilters {
  lotId: string | null
  projectId: string | null
  projectNumberId: string | null
  nextAction: string | null
  route: string | null
  search: string
}

export interface LotDashboardItem {
  lotId: string
  lotNumber: string
  projectId: string
  projectName: string
  projectNumber: string
  projectNumberId: string
  totalItems: number
  completedItems: number
  inProgressItems: number
  notStartedItems: number
  completionPercent: number
  lastActivityAt: string | null
  totalRequiredQuantity: number
  totalCutQuantity: number
  remainingCutQuantity: number
  totalOutBendQuantity: number
  remainingOutBendQuantity: number
  totalBendQuantity: number
  remainingBendQuantity: number
  totalRollingQuantity: number
  remainingRollingQuantity: number
  warehouseStockQuantity: number
  totalDispensedQuantity: number
  remainingToDispenseQuantity: number
  itemsWaitingCut: number
  itemsWaitingOutBend: number
  itemsWaitingBendReturn: number
  itemsWaitingRolling: number
  itemsInWarehouse: number
}

export type ActionQueueItem = ActionQueueRow