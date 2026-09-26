import { useState } from 'react'

import type { ProductionNextAction, ProductionProgressState, ProductionRoute } from '../types'

export interface ProductionFilterValues {
  query: string
  route: ProductionRoute | null
  nextAction: ProductionNextAction | null
  progressState: ProductionProgressState | null
}

const initialFilters: ProductionFilterValues = {
  query: '',
  route: null,
  nextAction: null,
  progressState: null,
}

export function useProductionFilters() {
  const [filters, setFilters] = useState<ProductionFilterValues>(initialFilters)
  const hasActiveFilters = Boolean(filters.query.trim() || filters.route)

  return {
    filters,
    hasActiveFilters,
    setQuery: (query: string) => setFilters((current) => ({ ...current, query })),
    setRoute: (route: ProductionRoute | null) => setFilters((current) => ({ ...current, route })),
    resetFilters: () => setFilters(initialFilters),
  }
}
