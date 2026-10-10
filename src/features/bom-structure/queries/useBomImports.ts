import { useQuery } from '@tanstack/react-query'

import { bomRepository } from '../repositories/bomRepository'
import type { BomImportListFilters } from '../types/bomBackend.types'
import { bomKeys } from './bomKeys'

export function useBomImports(filters: BomImportListFilters = {}) {
  return useQuery({
    queryKey: bomKeys.imports(filters),
    queryFn: () => bomRepository.listImports(filters),
    staleTime: 30_000,
  })
}
