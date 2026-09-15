import { useMutation, useQueryClient } from '@tanstack/react-query'

import { productionRepository } from '../productionRepository'
import { productionKeys } from '../queries/productionQueries'
import type { ProductionFilters } from '../types'
import type { ImportProductionFileInput } from '../import/types'

export function useImportProductionFile(filters: ProductionFilters) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ImportProductionFileInput) => productionRepository.importProductionPreparationFile(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productionKeys.search(filters) }),
  })
}
