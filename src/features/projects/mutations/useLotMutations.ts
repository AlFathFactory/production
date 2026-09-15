import { useMutation, useQueryClient } from '@tanstack/react-query'

import { projectsRepository } from '../projectsRepository'
import { projectKeys } from '../queries/projectKeys'
import type { LotFormValues } from '../types'

interface LotMutationValues extends LotFormValues {
  projectNumberId: string
}

interface UpdateLotMutationValues extends LotFormValues {
  id: string
  projectNumberId: string
}

export function useLotMutations() {
  const queryClient = useQueryClient()
  const invalidateLots = (projectNumberId: string) =>
    queryClient.invalidateQueries({ queryKey: projectKeys.lots(projectNumberId) })

  return {
    createLot: useMutation({
      mutationFn: ({ projectNumberId, ...values }: LotMutationValues) =>
        projectsRepository.createLot(projectNumberId, values),
      onSuccess: (_data, variables) => invalidateLots(variables.projectNumberId),
    }),
    updateLot: useMutation({
      mutationFn: ({ id, ...values }: UpdateLotMutationValues) => projectsRepository.updateLot(id, values),
      onSuccess: (_data, variables) => invalidateLots(variables.projectNumberId),
    }),
    deleteLot: useMutation({
      mutationFn: ({ id }: { id: string; projectNumberId: string }) => projectsRepository.deleteLot(id),
      onSuccess: (_data, variables) => invalidateLots(variables.projectNumberId),
    }),
  }
}
