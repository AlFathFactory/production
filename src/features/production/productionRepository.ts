import { supabase } from '../../services/supabase/client'
import type { ProductionFilters, ProductionSearchRow } from './types'

export class ProductionRepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductionRepositoryError'
  }
}

function mapProductionError(error: unknown): ProductionRepositoryError {
  const errorCode = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''

  if (errorCode === '42501') {
    return new ProductionRepositoryError('You do not have permission to view Production data.')
  }

  if (error instanceof TypeError || (error instanceof Error && /fetch|network|connection|offline/i.test(error.message))) {
    return new ProductionRepositoryError('Unable to reach Production Control. Check your connection and try again.')
  }

  return new ProductionRepositoryError('Production data could not be loaded. Please try again.')
}

export const productionRepository = {
  async searchProductionItems(filters: ProductionFilters): Promise<ProductionSearchRow[]> {
    const { data, error } = await supabase.rpc('search_production_items', {
      p_lot_id: filters.lotId ?? undefined,
      p_next_action: filters.nextAction ?? undefined,
      p_progress_state: filters.progressState ?? undefined,
      p_project_id: filters.projectId ?? undefined,
      p_project_number_id: filters.projectNumberId ?? undefined,
      p_query: filters.query.trim() || undefined,
      p_route: filters.route ?? undefined,
    })

    if (error) {
      throw mapProductionError(error)
    }

    return data
  },
}
