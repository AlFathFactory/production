import { supabase } from '../../services/supabase/client'
import type { ActionQueueItem, ActionQueueRow, DashboardFilters, LotDashboardItem, OutstandingDispatchReference } from './types'

export class DashboardRepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DashboardRepositoryError'
  }
}

type LotDashboardSelectRow = {
  lot_id: string | null
  lot_number: string | null
  project_id: string | null
  project_name: string | null
  project_number: string | null
  project_number_id: string | null
  total_items: number | null
  completed_items: number | null
  in_progress_items: number | null
  not_started_items: number | null
  completion_percent: number | null
  last_activity_at: string | null
  total_required_quantity: number | null
  total_cut_quantity: number | null
  remaining_cut_quantity: number | null
  total_out_bend_quantity: number | null
  remaining_out_bend_quantity: number | null
  total_bend_quantity: number | null
  remaining_bend_quantity: number | null
  total_rolling_quantity: number | null
  remaining_rolling_quantity: number | null
  warehouse_stock_quantity: number | null
  total_dispensed_quantity: number | null
  remaining_to_dispense_quantity: number | null
  items_waiting_cut: number | null
  items_waiting_out_bend: number | null
  items_waiting_bend_return: number | null
  items_waiting_rolling: number | null
  items_in_warehouse: number | null
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
    lotId: row.lot_id ?? '',
    lotNumber: row.lot_number ?? '—',
    projectId: row.project_id ?? '',
    projectName: row.project_name ?? '—',
    projectNumber: row.project_number ?? '—',
    projectNumberId: row.project_number_id ?? '',
    totalItems: row.total_items ?? 0,
    completedItems: row.completed_items ?? 0,
    inProgressItems: row.in_progress_items ?? 0,
    notStartedItems: row.not_started_items ?? 0,
    completionPercent: row.completion_percent ?? 0,
    lastActivityAt: row.last_activity_at,
    totalRequiredQuantity: row.total_required_quantity ?? 0,
    totalCutQuantity: row.total_cut_quantity ?? 0,
    remainingCutQuantity: row.remaining_cut_quantity ?? 0,
    totalOutBendQuantity: row.total_out_bend_quantity ?? 0,
    remainingOutBendQuantity: row.remaining_out_bend_quantity ?? 0,
    totalBendQuantity: row.total_bend_quantity ?? 0,
    remainingBendQuantity: row.remaining_bend_quantity ?? 0,
    totalRollingQuantity: row.total_rolling_quantity ?? 0,
    remainingRollingQuantity: row.remaining_rolling_quantity ?? 0,
    warehouseStockQuantity: row.warehouse_stock_quantity ?? 0,
    totalDispensedQuantity: row.total_dispensed_quantity ?? 0,
    remainingToDispenseQuantity: row.remaining_to_dispense_quantity ?? 0,
    itemsWaitingCut: row.items_waiting_cut ?? 0,
    itemsWaitingOutBend: row.items_waiting_out_bend ?? 0,
    itemsWaitingBendReturn: row.items_waiting_bend_return ?? 0,
    itemsWaitingRolling: row.items_waiting_rolling ?? 0,
    itemsInWarehouse: row.items_in_warehouse ?? 0,
  }
}

function escapeIlike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export const dashboardRepository = {
  async getLotDashboard(filters: DashboardFilters): Promise<LotDashboardItem[]> {
    let query = supabase
      .from('production_lot_dashboard')
      .select('lot_id, lot_number, project_id, project_name, project_number, project_number_id, total_items, completed_items, in_progress_items, not_started_items, completion_percent, last_activity_at, total_required_quantity, total_cut_quantity, remaining_cut_quantity, total_out_bend_quantity, remaining_out_bend_quantity, total_bend_quantity, remaining_bend_quantity, total_rolling_quantity, remaining_rolling_quantity, warehouse_stock_quantity, total_dispensed_quantity, remaining_to_dispense_quantity, items_waiting_cut, items_waiting_out_bend, items_waiting_bend_return, items_waiting_rolling, items_in_warehouse')
      .order('last_activity_at', { ascending: false })

    if (filters.projectId) query = query.eq('project_id', filters.projectId)
    if (filters.projectNumberId) query = query.eq('project_number_id', filters.projectNumberId)
    if (filters.lotId) query = query.eq('lot_id', filters.lotId)

    const { data, error } = await query

    if (error) throw mapDashboardError(error, 'lot_dashboard')

    return (data ?? []).map(mapLotDashboardRow)
  },

  async getActionQueue(filters: DashboardFilters): Promise<ActionQueueItem[]> {
    let query = supabase
      .from('production_action_queue')
      .select('lot_id, lot_number, project_id, project_name, project_number, project_number_id, production_item_id, article, designation, profile, routing, next_action, available_action_quantity, progress_state, completion_percent, total_quantity, cut_total, out_bend_total, bend_total, rolling_total, warehouse_stock, dispensed_total, last_activity_at')
      .order('last_activity_at', { ascending: true })

    let outstandingDispatchesQuery = supabase.rpc('search_bending_destination_inventory', {
      p_outstanding_only: true,
    })

    if (filters.projectId) query = query.eq('project_id', filters.projectId)
    if (filters.projectNumberId) query = query.eq('project_number_id', filters.projectNumberId)
    if (filters.lotId) query = query.eq('lot_id', filters.lotId)
    if (filters.nextAction) query = query.eq('next_action', filters.nextAction)
    if (filters.route) query = query.eq('routing', filters.route as NonNullable<ActionQueueRow['routing']>)
    if (filters.search.trim()) query = query.ilike('article', `%${escapeIlike(filters.search.trim())}%`)

    if (filters.projectId) outstandingDispatchesQuery = outstandingDispatchesQuery.eq('project_id', filters.projectId)
    if (filters.lotId) outstandingDispatchesQuery = outstandingDispatchesQuery.eq('lot_id', filters.lotId)

    const [actionQueueResult, outstandingDispatchesResult] = await Promise.all([
      query,
      outstandingDispatchesQuery,
    ])

    if (actionQueueResult.error) throw mapDashboardError(actionQueueResult.error, 'action_queue')
    if (outstandingDispatchesResult.error) throw mapDashboardError(outstandingDispatchesResult.error, 'action_queue')

    const referencesByItem = new Map<string, Map<string, OutstandingDispatchReference>>()
    for (const row of outstandingDispatchesResult.data ?? []) {
      if (
        !row.production_item_id
        || !row.destination_id
        || !row.destination_name
        || !row.dispatch_item_id
        || !row.dispatch_number
      ) continue
      const references = referencesByItem.get(row.production_item_id) ?? new Map<string, OutstandingDispatchReference>()
      references.set(row.dispatch_item_id, {
        destination: row.destination_name,
        destinationId: row.destination_id,
        dispatchItemId: row.dispatch_item_id,
        dispatchNumber: row.dispatch_number,
      })
      referencesByItem.set(row.production_item_id, references)
    }

    return (actionQueueResult.data ?? []).map((item) => ({
      ...item,
      outstandingDispatches: item.production_item_id
        ? [...(referencesByItem.get(item.production_item_id)?.values() ?? [])]
        : [],
    }))
  },
}
