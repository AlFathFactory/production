import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { Json } from '../../../types/database'
import { productionKeys } from '../../production/queries/productionQueries'
import { bomKeys } from '../queries/bomKeys'
import { bomRepository } from '../repositories/bomRepository'

function newExtractionRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function useBomExtraction(importId: string) {
  const queryClient = useQueryClient()
  // Stable per user intent: retries of the same confirmation reuse the same
  // request ID so the backend returns the prior result instead of writing
  // duplicates. Only rotate after the ledger status has been rechecked.
  const [requestId, setRequestId] = useState(() => newExtractionRequestId())

  const mutation = useMutation({
    mutationFn: (assignments: Record<string, string>) => bomRepository.extractToProduction({
      p_assignments: assignments as unknown as Json,
      p_bom_import_id: importId,
      p_request_id: requestId,
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.extractionStatus(importId) })
      void queryClient.invalidateQueries({ queryKey: bomKeys.extraction(importId) })
      void queryClient.invalidateQueries({ queryKey: productionKeys.all })
    },
  })

  return {
    executeMutation: mutation,
    requestId,
    rotateRequestId: () => setRequestId(newExtractionRequestId()),
  }
}
