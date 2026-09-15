import { useMutation, useQueryClient } from '@tanstack/react-query'

import { productionRepository } from '../productionRepository'
import { productionKeys } from '../queries/productionQueries'
import type { AddProductionStageEntryInput, ProductionFilters } from '../types'

export function useAddProductionStageEntry(filters: ProductionFilters) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AddProductionStageEntryInput) => productionRepository.addProductionStageEntry(input),
    onError: () => queryClient.invalidateQueries({ queryKey: productionKeys.search(filters) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productionKeys.search(filters) }),
  })
}
