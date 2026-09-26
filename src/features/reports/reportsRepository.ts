import { supabase } from '../../services/supabase/client'
import type { ReportFilters, ReportRow } from './types'

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

export const reportsRepository = {
  async searchProductionOperations(filters: ReportFilters): Promise<ReportRow[]> {
    const { data, error } = await supabase.rpc('search_production_operations_report', {
      p_date_from: filters.dateFrom ?? undefined,
      p_date_to: filters.dateTo ?? undefined,
      p_lot_id: filters.lotId ?? undefined,
      p_operations: filters.operations.length > 0 ? filters.operations : undefined,
      p_performed_by: filters.performedBy.trim() || undefined,
      p_project_id: filters.projectId ?? undefined,
      p_project_number_id: filters.projectNumberId ?? undefined,
      p_query: filters.query.trim() || undefined,
      p_routing: filters.routing ?? undefined,
    })

    if (error) {
      throw mapReportsError(error)
    }

    return data
  },
}
