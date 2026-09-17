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

export interface DashboardSummary {
  totalLots: number
  totalItems: number
  inProgressItems: number
  completedItems: number
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
}

export type ActionQueueItem = ActionQueueRow