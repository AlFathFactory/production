import { useMutation, useQueryClient } from '@tanstack/react-query'

import { productionHistoryRepository } from '../productionHistoryRepository'
import type { CorrectProductionStageEntryInput, DeleteProductionStageEntryInput } from '../types'
import { productionHistoryKeys } from '../queries/productionHistoryQueries'
import { productionKeys } from '../../queries/productionQueries'

export function useCorrectProductionStageEntry(productionItemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CorrectProductionStageEntryInput) => productionHistoryRepository.correctEntry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionHistoryKeys.history({ productionItemId }) })
      queryClient.invalidateQueries({ queryKey: productionHistoryKeys.audit({ productionItemId }) })
      queryClient.invalidateQueries({ queryKey: productionKeys.all })
    },
  })
}

export function useDeleteProductionStageEntry(productionItemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DeleteProductionStageEntryInput) => productionHistoryRepository.deleteEntry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionHistoryKeys.history({ productionItemId }) })
      queryClient.invalidateQueries({ queryKey: productionHistoryKeys.audit({ productionItemId }) })
      queryClient.invalidateQueries({ queryKey: productionKeys.all })
    },
  })
}