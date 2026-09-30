import { useMutation, useQueryClient } from '@tanstack/react-query'

import { productionKeys } from '../../production/queries/productionQueries'
import { bendingRepository, shouldRefreshBendingAvailability } from '../bendingRepository'
import { bendingKeys } from '../queries/bendingQueries'
import type { CreateBendingDispatchInput } from '../types'

export function useCreateBendingDispatch() {
  const queryClient = useQueryClient()
  const refreshProduction = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: productionKeys.all }),
    queryClient.invalidateQueries({ queryKey: bendingKeys.destinationData }),
  ])

  return useMutation({
    mutationFn: (input: CreateBendingDispatchInput) => bendingRepository.createDispatch(input),
    onError: (error) => shouldRefreshBendingAvailability(error) ? refreshProduction() : undefined,
    onSuccess: refreshProduction,
  })
}
