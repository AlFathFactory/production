import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { Json } from '../../../types/database'
import { buildBomNodeSavePayload } from '../mappers/bomSavePayload'
import type { BomNodeSaveDto } from '../mappers/bomSavePayload'
import { bomKeys } from '../queries/bomKeys'
import { bomRepository } from '../repositories/bomRepository'
import type { BomParseResult } from '../types'
import type { BomValidationResult } from '../mappers/bomValidation'

export function useBomNodeSave() {
  const queryClient = useQueryClient()
  const [validation, setValidation] = useState<BomValidationResult | null>(null)
  const [validatedImportId, setValidatedImportId] = useState<string | null>(null)
  const [validatedPayload, setValidatedPayload] = useState<BomNodeSaveDto[] | null>(null)
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false)

  const validateMutation = useMutation({
    mutationFn: async ({ importId, parsed }: { importId: string; parsed: BomParseResult }) => {
      const payload = buildBomNodeSavePayload(parsed)
      const result = await bomRepository.validateNodes(payload as unknown as Json)
      return { importId, payload, result }
    },
    onMutate: () => {
      setValidation(null)
      setValidatedImportId(null)
      setValidatedPayload(null)
      setAcknowledgedWarnings(false)
    },
    onSuccess: ({ importId, payload, result }) => {
      setValidatedImportId(importId)
      setValidation(result)
      setValidatedPayload(result.isValid && result.errorCount === 0 ? payload : null)
    },
    onError: () => {
      setValidation(null)
      setValidatedImportId(null)
      setValidatedPayload(null)
    },
  })

  const saveMutation = useMutation({
    mutationFn: async ({ importId }: { importId: string }) => {
      if (validatedImportId !== importId || !validation?.isValid || validation.errorCount > 0 || !validatedPayload) {
        throw new Error('Validate this workbook before saving its structure.')
      }
      if (validation.warningCount > 0 && !acknowledgedWarnings) {
        throw new Error('Acknowledge the backend warnings before saving.')
      }
      if (validatedPayload.length !== validation.nodeCount) {
        throw new Error('The validated payload does not match the validation result. Validate again before saving.')
      }
      const result = await bomRepository.saveNodes({ p_bom_import_id: importId, p_nodes: validatedPayload as unknown as Json })
      if (result.importId !== importId || result.insertedCount !== validatedPayload.length) {
        throw new Error('The save response needs review. Reload the import before retrying.')
      }
      return result
    },
    onSuccess: async ({ importId }) => {
      setValidatedPayload(null)
      setValidation(null)
      setValidatedImportId(null)
      setAcknowledgedWarnings(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bom', 'imports'] }),
        queryClient.invalidateQueries({ queryKey: bomKeys.import(importId) }),
        queryClient.invalidateQueries({ queryKey: bomKeys.tree(importId) }),
        queryClient.invalidateQueries({ queryKey: bomKeys.summary(importId) }),
        queryClient.invalidateQueries({ queryKey: bomKeys.warnings(importId) }),
        queryClient.invalidateQueries({ queryKey: bomKeys.rollups(importId) }),
      ])
    },
  })

  const reset = () => {
    if (validateMutation.isPending || saveMutation.isPending) return
    setValidation(null)
    setValidatedImportId(null)
    setValidatedPayload(null)
    setAcknowledgedWarnings(false)
    validateMutation.reset()
    saveMutation.reset()
  }

  return {
    acknowledgedWarnings,
    isBusy: validateMutation.isPending || saveMutation.isPending,
    reset,
    saveMutation,
    setAcknowledgedWarnings,
    validateMutation,
    validation,
    validatedImportId,
  }
}
