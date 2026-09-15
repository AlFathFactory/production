import { useMutation, useQueryClient } from '@tanstack/react-query'

import { productionRepository } from '../productionRepository'
import { productionKeys } from '../queries/productionQueries'
import type { CreateProductionItemInput, ProductionFilters } from '../types'

export function useCreateProductionItem(filters: ProductionFilters) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProductionItemInput) => productionRepository.createProductionItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productionKeys.search(filters) }),
  })
}
