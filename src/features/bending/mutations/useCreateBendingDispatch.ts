import { useMutation, useQueryClient } from '@tanstack/react-query'

import { productionKeys } from '../../production/queries/productionQueries'
import { bendingRepository, shouldRefreshBendingAvailability } from '../bendingRepository'
import type { CreateBendingDispatchInput } from '../types'

export function useCreateBendingDispatch() {
  const queryClient = useQueryClient()
  const refreshProduction = () => queryClient.invalidateQueries({ queryKey: productionKeys.all })

  return useMutation({
    mutationFn: (input: CreateBendingDispatchInput) => bendingRepository.createDispatch(input),
    onError: (error) => shouldRefreshBendingAvailability(error) ? refreshProduction() : undefined,
    onSuccess: refreshProduction,
  })
}
