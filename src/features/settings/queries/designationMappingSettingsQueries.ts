import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { bomKeys } from '../../bom-structure/queries/bomKeys'
import { designationMappingSettingsRepository } from '../repositories/designationMappingSettingsRepository'
import type { DesignationMappingInput, DesignationTypeInput } from '../types'

const typeSettingsKey = [...bomKeys.designationTypesRoot, 'all'] as const
const mappingSettingsKey = [...bomKeys.designationMappingsRoot, 'all'] as const

function useInvalidateDesignationSettings() {
  const queryClient = useQueryClient()
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: bomKeys.designationTypesRoot }),
    queryClient.invalidateQueries({ queryKey: bomKeys.designationMappingsRoot }),
  ])
}

export function useDesignationTypeSettings() {
  return useQuery({ queryKey: typeSettingsKey, queryFn: designationMappingSettingsRepository.listTypes })
}

export function useDesignationMappingSettings() {
  return useQuery({ queryKey: mappingSettingsKey, queryFn: designationMappingSettingsRepository.listMappings })
}

export function useCreateDesignationType() {
  const invalidate = useInvalidateDesignationSettings()
  return useMutation({ mutationFn: (input: DesignationTypeInput) => designationMappingSettingsRepository.createType(input), onSuccess: invalidate })
}

export function useUpdateDesignationType() {
  const invalidate = useInvalidateDesignationSettings()
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: DesignationTypeInput }) => designationMappingSettingsRepository.updateType(id, input), onSuccess: invalidate })
}

export function useDeleteDesignationType() {
  const invalidate = useInvalidateDesignationSettings()
  return useMutation({ mutationFn: designationMappingSettingsRepository.deleteType, onSuccess: invalidate })
}

export function useCreateDesignationMapping() {
  const invalidate = useInvalidateDesignationSettings()
  return useMutation({ mutationFn: (input: DesignationMappingInput) => designationMappingSettingsRepository.createMapping(input), onSuccess: invalidate })
}

export function useUpdateDesignationMapping() {
  const invalidate = useInvalidateDesignationSettings()
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: DesignationMappingInput }) => designationMappingSettingsRepository.updateMapping(id, input), onSuccess: invalidate })
}

export function useDeleteDesignationMapping() {
  const invalidate = useInvalidateDesignationSettings()
  return useMutation({ mutationFn: designationMappingSettingsRepository.deleteMapping, onSuccess: invalidate })
}
