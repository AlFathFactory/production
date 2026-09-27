import { supabase } from '../../services/supabase/client'
import type { Database } from '../../types/database'
import type { CurrentStatusFilters, CurrentStatusRow, ReportFilters, ReportRow } from './types'

export class ReportsRepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReportsRepositoryError'
  }
}

function mapReportsError(error: unknown): ReportsRepositoryError {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''

  if (code === '42501') {
    return new ReportsRepositoryError('You do not have permission to view Production reports.')
  }

  if (error instanceof TypeError || (error instanceof Error && /fetch|network|connection|offline/i.test(error.message))) {
    return new ReportsRepositoryError('Unable to reach Production Control. Check your connection and try again.')
  }

  return new ReportsRepositoryError('The Production report could not be loaded. Please try again.')
}

const ARTICLE_TOTAL_BATCH_SIZE = 100

async function addArticleTotalQuantities(
  rows: Database['public']['Functions']['search_production_operations_report']['Returns'],
): Promise<ReportRow[]> {
  const itemIds = [...new Set(rows.flatMap((row) => row.production_item_id ? [row.production_item_id] : []))]
  const batches: string[][] = []

  for (let index = 0; index < itemIds.length; index += ARTICLE_TOTAL_BATCH_SIZE) {
    batches.push(itemIds.slice(index, index + ARTICLE_TOTAL_BATCH_SIZE))
  }

  const results = await Promise.all(batches.map((batch) => (
    supabase
      .from('production_items')
      .select('id, total_quantity')
      .in('id', batch)
  )))

  const failedResult = results.find(({ error }) => error)
  if (failedResult?.error) {
    throw mapReportsError(failedResult.error)
  }

  const totalsByItemId = new Map(
    results.flatMap(({ data }) => data ?? []).map((item) => [item.id, item.total_quantity]),
  )

  return rows.map((row) => ({
    ...row,
    article_total_quantity: row.production_item_id
      ? totalsByItemId.get(row.production_item_id) ?? null
      : null,
  }))
}

export const reportsRepository = {
  async searchProductionOperations(filters: ReportFilters): Promise<ReportRow[]> {
    const { data, error } = await supabase.rpc('search_production_operations_report', {
      p_date_from: filters.dateFrom ?? undefined,
      p_date_to: filters.dateTo ?? undefined,
      p_lot_id: filters.lotId ?? undefined,
      p_operations: filters.operations.length > 0 ? filters.operations : undefined,
      p_performed_by: filters.performedBy || undefined,
      p_project_id: filters.projectId ?? undefined,
      p_project_number_id: filters.projectNumberId ?? undefined,
      p_article_query: filters.query.trim() || undefined,
      p_routing: filters.routing ?? undefined,
    })

    if (error) {
      throw mapReportsError(error)
    }

    return addArticleTotalQuantities(data)
  },

  async searchProductionStatus(filters: CurrentStatusFilters): Promise<CurrentStatusRow[]> {
    const { data, error } = await supabase.rpc('search_production_status_report', {
      p_lot_id: filters.lotId ?? undefined,
      p_progress_state: filters.progressState ?? undefined,
      p_project_id: filters.projectId ?? undefined,
      p_project_number_id: filters.projectNumberId ?? undefined,
      p_query: filters.query.trim() || undefined,
      p_routing: filters.routing ?? undefined,
      p_statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
    })

    if (error) {
      throw mapReportsError(error)
    }

    return data
  },
}
