import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { reportsRepository } from '../reportsRepository'
import type { ReportFilters } from '../types'

const REPORT_SEARCH_KEY = 'production-operations-report'

export const reportKeys = {
  all: [REPORT_SEARCH_KEY] as const,
  search: (filters: ReportFilters) => [
    REPORT_SEARCH_KEY,
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
}

export function useProductionOperationsReport(filters: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.search(filters),
    queryFn: () => reportsRepository.searchProductionOperations(filters),
    placeholderData: keepPreviousData,
  })
}
