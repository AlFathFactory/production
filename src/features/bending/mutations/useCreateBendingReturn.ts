import { useMutation, useQueryClient } from '@tanstack/react-query'

import { productionKeys } from '../../production/queries/productionQueries'
import { bendingRepository, shouldRefreshBendingReturn } from '../bendingRepository'
import { bendingKeys } from '../queries/bendingQueries'
import type { CreateBendingReturnInput } from '../types'

export function useCreateBendingReturn() {
  const queryClient = useQueryClient()
  const refreshAuthoritativeData = (input: CreateBendingReturnInput) => Promise.all([
    queryClient.invalidateQueries({ queryKey: bendingKeys.dispatches(input.lotId) }),
    queryClient.invalidateQueries({ queryKey: bendingKeys.returnLines(input.dispatchId) }),
    queryClient.invalidateQueries({ queryKey: productionKeys.all }),
  ])

  return useMutation({
    mutationFn: (input: CreateBendingReturnInput) => bendingRepository.createReturn(input),
    onError: (error, input) => shouldRefreshBendingReturn(error) ? refreshAuthoritativeData(input) : undefined,
    onSuccess: (_, input) => refreshAuthoritativeData(input),
  })
}
