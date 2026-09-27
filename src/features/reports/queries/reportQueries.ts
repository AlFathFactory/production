import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { reportsRepository } from '../reportsRepository'
import type { CurrentStatusFilters, ReportFilters } from '../types'

const REPORTS_KEY = 'reports'

export const reportKeys = {
  all: [REPORTS_KEY] as const,
  historical: (filters: ReportFilters) => [
    REPORTS_KEY,
    'historical-events',
    {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      projectId: filters.projectId,
      projectNumberId: filters.projectNumberId,
      lotId: filters.lotId,
      operations: filters.operations,
      routing: filters.routing,
      query: filters.query,
      performedBy: filters.performedBy,
    },
  ] as const,
  currentStatus: (filters: CurrentStatusFilters) => [
    REPORTS_KEY,
    'current-status',
    {
      projectId: filters.projectId,
      projectNumberId: filters.projectNumberId,
      lotId: filters.lotId,
      statuses: filters.statuses,
      routing: filters.routing,
      query: filters.query,
      progressState: filters.progressState,
    },
  ] as const,
}

export function useProductionOperationsReport(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: reportKeys.historical(filters),
    queryFn: () => reportsRepository.searchProductionOperations(filters),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useProductionStatusReport(filters: CurrentStatusFilters, enabled = true) {
  return useQuery({
    queryKey: reportKeys.currentStatus(filters),
    queryFn: () => reportsRepository.searchProductionStatus(filters),
    placeholderData: keepPreviousData,
    enabled,
  })
}
