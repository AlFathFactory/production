import { useQuery } from '@tanstack/react-query'

import { productionRepository } from '../../production/productionRepository'
import { dashboardRepository } from '../dashboardRepository'
import type { DashboardFilters } from '../types'

export interface DashboardHierarchyFilters {
  lotId: string | null
  projectId: string | null
  projectNumberId: string | null
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  lotDashboard: (filters: DashboardFilters) => [...dashboardKeys.all, 'lot-dashboard', filters] as const,
  actionQueue: (filters: DashboardFilters) => [...dashboardKeys.all, 'action-queue', filters] as const,
  productionItems: (filters: DashboardHierarchyFilters) => [...dashboardKeys.all, 'production-items', filters] as const,
}

export function useLotDashboard(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.lotDashboard(filters),
    queryFn: () => dashboardRepository.getLotDashboard(filters),
  })
}

export function useActionQueue(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.actionQueue(filters),
    queryFn: () => dashboardRepository.getActionQueue(filters),
  })
}

export function useDashboardProductionItems(filters: DashboardHierarchyFilters) {
  return useQuery({
    queryKey: dashboardKeys.productionItems(filters),
    queryFn: () =>
      productionRepository.searchProductionItems({
        lotId: filters.lotId,
        nextAction: null,
        progressState: null,
        projectId: filters.projectId,
        projectNumberId: filters.projectNumberId,
        query: '',
        route: null,
      }),
  })
}