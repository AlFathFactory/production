import { useQuery } from '@tanstack/react-query'

import { productionRepository } from '../productionRepository'
import type { ProductionFilters } from '../types'

const PRODUCTION_SEARCH_KEY = 'production-search'

export const productionKeys = {
  all: [PRODUCTION_SEARCH_KEY] as const,
  search: (filters: ProductionFilters) => [
    PRODUCTION_SEARCH_KEY,
    {
      projectId: filters.projectId,
      projectNumberId: filters.projectNumberId,
      lotId: filters.lotId,
      query: filters.query,
      route: filters.route,
      nextAction: filters.nextAction,
      progressState: filters.progressState,
    },
  ] as const,
}

export function useProductionItems(filters: ProductionFilters) {
  return useQuery({
    queryKey: productionKeys.search(filters),
    queryFn: () => productionRepository.searchProductionItems(filters),
    enabled: Boolean(filters.lotId),
  })
}
