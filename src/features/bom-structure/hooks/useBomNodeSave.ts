import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { Json } from '../../../types/database'
import { buildBomNodeSavePayload } from '../mappers/bomSavePayload'
import type { BomNodeSaveDto } from '../mappers/bomSavePayload'
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

  const saveValidated = async (importId: string, replace: boolean) => {
      if (validatedImportId !== importId || !validation?.isValid || validation.errorCount > 0 || !validatedPayload) {
        throw new Error('Validate this workbook before saving its structure.')
      }
      if (validation.warningCount > 0 && !acknowledgedWarnings) {
        throw new Error('Acknowledge the backend warnings before saving.')
      }
      if (validatedPayload.length !== validation.nodeCount) {
        throw new Error('The validated payload does not match the validation result. Validate again before saving.')
      }
      const payload = { p_bom_import_id: importId, p_nodes: validatedPayload as unknown as Json }
      const result = replace ? await bomRepository.replaceNodes(payload) : await bomRepository.saveNodes(payload)
      if (result.importId !== importId || result.insertedCount !== validatedPayload.length) {
        throw new Error('The save response needs review. Reload the import before retrying.')
      }
      return result
  }

  const onSaved = async () => {
      setValidatedPayload(null)
      setValidation(null)
      setValidatedImportId(null)
      setAcknowledgedWarnings(false)
      await queryClient.invalidateQueries({ queryKey: ['bom'] })
  }

  const saveMutation = useMutation({
    mutationFn: ({ importId }: { importId: string }) => saveValidated(importId, false),
    onSuccess: onSaved,
  })

  const replaceMutation = useMutation({
    mutationFn: ({ importId }: { importId: string }) => saveValidated(importId, true),
    onSuccess: onSaved,
  })

  const reset = () => {
    if (validateMutation.isPending || saveMutation.isPending || replaceMutation.isPending) return
    setValidation(null)
    setValidatedImportId(null)
    setValidatedPayload(null)
    setAcknowledgedWarnings(false)
    validateMutation.reset()
    saveMutation.reset()
    replaceMutation.reset()
  }

  return {
    acknowledgedWarnings,
    isBusy: validateMutation.isPending || saveMutation.isPending || replaceMutation.isPending,
    replaceMutation,
    reset,
    saveMutation,
    setAcknowledgedWarnings,
    validateMutation,
    validation,
    validatedImportId,
  }
}
