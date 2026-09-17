import { supabase } from '../../services/supabase/client'
import type { ActionQueueRow, DashboardFilters, LotDashboardItem } from './types'

export class DashboardRepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DashboardRepositoryError'
  }
}

type LotDashboardSelectRow = {
  lot_id: string
  lot_number: string
  project_id: string
  project_name: string
  project_number: string
  project_number_id: string
  total_items: number
  completed_items: number
  in_progress_items: number
  not_started_items: number
  completion_percent: number
  last_activity_at: string | null
}

function mapDashboardError(error: unknown, context: 'lot_dashboard' | 'action_queue'): DashboardRepositoryError {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  const message = error instanceof Error ? error.message : ''

  if (code === '42501' || /permission denied/i.test(message)) {
    return new DashboardRepositoryError(`You do not have permission to view the ${context === 'lot_dashboard' ? 'lot dashboard' : 'action queue'}.`)
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new DashboardRepositoryError('Unable to reach Production Control. Check your connection and try again.')
  }
  return new DashboardRepositoryError(`${context === 'lot_dashboard' ? 'Lot dashboard' : 'Action queue'} could not be loaded. Please try again.`)
}

function mapLotDashboardRow(row: LotDashboardSelectRow): LotDashboardItem {
  return {
    lotId: row.lot_id,
    lotNumber: row.lot_number,
    projectId: row.project_id,
    projectName: row.project_name,
    projectNumber: row.project_number,
    projectNumberId: row.project_number_id,
    totalItems: row.total_items,
    completedItems: row.completed_items,
    inProgressItems: row.in_progress_items,
    notStartedItems: row.not_started_items,
    completionPercent: row.completion_percent,
    lastActivityAt: row.last_activity_at,
  }
}

function escapeIlike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export const dashboardRepository = {
  async getLotDashboard(filters: DashboardFilters): Promise<LotDashboardItem[]> {
    let query = supabase
      .from('production_lot_dashboard')
      .select('lot_id, lot_number, project_id, project_name, project_number, project_number_id, total_items, completed_items, in_progress_items, not_started_items, completion_percent, last_activity_at')
      .order('last_activity_at', { ascending: false })

    if (filters.projectId) query = query.eq('project_id', filters.projectId)
    if (filters.projectNumberId) query = query.eq('project_number_id', filters.projectNumberId)
    if (filters.lotId) query = query.eq('lot_id', filters.lotId)

    const { data, error } = await query

    if (error) throw mapDashboardError(error, 'lot_dashboard')

    return (data ?? []).map(mapLotDashboardRow)
  },

  async getActionQueue(filters: DashboardFilters): Promise<ActionQueueRow[]> {
    let query = supabase
      .from('production_action_queue')
      .select('lot_id, lot_number, project_id, project_name, project_number, project_number_id, production_item_id, article, designation, profile, routing, next_action, available_action_quantity, progress_state, total_quantity, cut_total, out_bend_total, bend_total, rolling_total, warehouse_stock, dispensed_total, last_activity_at')
      .order('last_activity_at', { ascending: true })

    if (filters.projectId) query = query.eq('project_id', filters.projectId)
    if (filters.projectNumberId) query = query.eq('project_number_id', filters.projectNumberId)
    if (filters.lotId) query = query.eq('lot_id', filters.lotId)
    if (filters.nextAction) query = query.eq('next_action', filters.nextAction)
    if (filters.route) query = query.eq('routing', filters.route)
    if (filters.search.trim()) query = query.ilike('article', `%${escapeIlike(filters.search.trim())}%`)

    const { data, error } = await query

    if (error) throw mapDashboardError(error, 'action_queue')

    return (data ?? []) as ActionQueueRow[]
  },
}