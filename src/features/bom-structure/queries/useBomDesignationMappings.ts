import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { BOM_DESIGNATION_MAPPING_STALE_TIME_MS } from '../bomSettings'
import { bomRepository } from '../repositories/bomRepository'
import { bomKeys } from './bomKeys'

export function useBomDesignationMappings() {
  const queryClient = useQueryClient()
  const typesQuery = useQuery({
    queryKey: bomKeys.designationTypes,
    queryFn: () => bomRepository.getActiveDesignationTypes(),
    staleTime: BOM_DESIGNATION_MAPPING_STALE_TIME_MS,
  })
  const mappingsQuery = useQuery({
    queryKey: bomKeys.designationMappings,
    queryFn: () => bomRepository.getActiveDesignationMappings(),
    staleTime: BOM_DESIGNATION_MAPPING_STALE_TIME_MS,
  })
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: bomKeys.designationMappingsRoot }),
      queryClient.invalidateQueries({ queryKey: bomKeys.designationTypesRoot }),
    ])
  }
  const createMutation = useMutation({
    mutationFn: ({ code, typeId }: { code: string; typeId: string }) => bomRepository.createDesignationMapping(code, typeId),
    onSuccess: refresh,
  })
  const updateMutation = useMutation({
    mutationFn: ({ mappingId, typeId }: { mappingId: string; typeId: string }) => bomRepository.updateDesignationMapping(mappingId, typeId),
    onSuccess: refresh,
  })
  return { typesQuery, mappingsQuery, createMutation, updateMutation, refresh }
}
