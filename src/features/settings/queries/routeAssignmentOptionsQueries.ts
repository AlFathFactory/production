import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { routeAssignmentOptionsRepository } from '../repositories/routeAssignmentOptionsRepository'
import type { CreateBomRouteAssignmentOptionInput, UpdateBomRouteAssignmentOptionInput } from '../types'

export const routeAssignmentOptionsKeys = { all: ['bom-route-assignment-options'] as const }

export function useRouteAssignmentOptions() {
  return useQuery({ queryKey: routeAssignmentOptionsKeys.all, queryFn: routeAssignmentOptionsRepository.listRouteAssignmentOptions })
}

function useInvalidateRouteOptions() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: routeAssignmentOptionsKeys.all })
}

export function useCreateRouteAssignmentOption() {
  const invalidate = useInvalidateRouteOptions()
  return useMutation({ mutationFn: (input: CreateBomRouteAssignmentOptionInput) => routeAssignmentOptionsRepository.createRouteAssignmentOption(input), onSuccess: invalidate })
}

export function useUpdateRouteAssignmentOption() {
  const invalidate = useInvalidateRouteOptions()
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: UpdateBomRouteAssignmentOptionInput }) => routeAssignmentOptionsRepository.updateRouteAssignmentOption(id, input), onSuccess: invalidate })
}

export function useDeleteRouteAssignmentOption() {
  const invalidate = useInvalidateRouteOptions()
  return useMutation({ mutationFn: routeAssignmentOptionsRepository.deleteRouteAssignmentOption, onSuccess: invalidate })
}
