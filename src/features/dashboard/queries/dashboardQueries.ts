import { useQuery } from '@tanstack/react-query'

import { dashboardRepository } from '../dashboardRepository'
import type { DashboardFilters } from '../types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  lotDashboard: (filters: DashboardFilters) => [...dashboardKeys.all, 'lot-dashboard', filters] as const,
  actionQueue: (filters: DashboardFilters) => [...dashboardKeys.all, 'action-queue', filters] as const,
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