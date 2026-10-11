import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Json } from '../../../types/database'
import { buildDimensionAssignments, type DimensionRole } from '../descriptionDimensions'
import { bomRepository } from '../repositories/bomRepository'
import { bomKeys } from './bomKeys'
import { BOM_DIMENSION_MAPPING_STALE_TIME_MS } from '../bomSettings'

interface SaveDimensionInput {
  code: string
  description: string
  roles: DimensionRole[]
}

export function useBomDimensionMapping(code: string, description: string, enabled: boolean) {
  const queryClient = useQueryClient()
  const queryKey = bomKeys.dimensionMapping(code, description)
  const mappingQuery = useQuery({
    queryKey,
    queryFn: () => bomRepository.getDimensionMapping(code, description),
    enabled: enabled && Boolean(description.trim()),
    staleTime: BOM_DIMENSION_MAPPING_STALE_TIME_MS,
  })
  const saveMutation = useMutation({
    mutationFn: async ({ code: saveCode, description: saveDescription, roles }: SaveDimensionInput) => {
      const assignments = buildDimensionAssignments(saveDescription, roles)
      const saved = await bomRepository.saveDimensionMapping({
        p_code: saveCode,
        p_description: saveDescription,
        p_assignments: assignments as unknown as Json,
      })
      if (saved.savedCount !== assignments.length
        || saved.description !== saveDescription.trim()
        || (saved.code ?? '') !== saveCode.trim()) {
        throw new Error('The mapping save response needs review. Reload this mapping before retrying.')
      }
      return saved
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
    onSuccess: async () => {
      // Dimension mappings are part of the extraction-candidate calculation.
      // Refresh any mounted preview immediately and mark the rest stale for the
      // next time its import is opened.
      await queryClient.invalidateQueries({ queryKey: bomKeys.extractions })
    },
  })
  return { mappingQuery, saveMutation }
}
