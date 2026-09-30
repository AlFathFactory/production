import { useMutation, useQueryClient } from '@tanstack/react-query'

import { bendingRepository } from '../bendingRepository'
import { bendingKeys } from '../queries/bendingQueries'

interface CreateBendingDestinationInput {
  createdBy: string
  name: string
}

export function useCreateBendingDestination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ createdBy, name }: CreateBendingDestinationInput) => bendingRepository.createDestination(name, createdBy),
    onSettled: () => queryClient.invalidateQueries({ queryKey: bendingKeys.destinationData }),
  })
}
