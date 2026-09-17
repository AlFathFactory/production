import { useQuery } from '@tanstack/react-query'

import { productionHistoryRepository } from '../productionHistoryRepository'
import type { ProductionHistoryFilters } from '../types'

export const productionHistoryKeys = {
  all: ['production-history'] as const,
  history: (filters: ProductionHistoryFilters) => [...productionHistoryKeys.all, 'history', filters] as const,
  audit: (filters: ProductionHistoryFilters) => [...productionHistoryKeys.all, 'audit', filters] as const,
}

export function useProductionHistory(filters: ProductionHistoryFilters) {
  return useQuery({
    queryKey: productionHistoryKeys.history(filters),
    queryFn: () => productionHistoryRepository.getHistory(filters),
    enabled: Boolean(filters.productionItemId),
  })
}

export function useProductionAudit(filters: ProductionHistoryFilters) {
  return useQuery({
    queryKey: productionHistoryKeys.audit(filters),
    queryFn: () => productionHistoryRepository.getAudit(filters),
    enabled: Boolean(filters.productionItemId),
  })
}