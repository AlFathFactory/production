import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { dispenseRepository } from '../dispenseRepository'
import type { DispenseHistoryFilters } from '../types'

export const dispenseKeys = {
  all: ['dispense'] as const,
  recipients: ['dispense', 'recipients'] as const,
  histories: ['dispense', 'history'] as const,
  history: (filters: DispenseHistoryFilters) => ['dispense', 'history', filters] as const,
}

export function useDispenseRecipients() {
  return useQuery({
    queryKey: dispenseKeys.recipients,
    queryFn: () => dispenseRepository.listRecipients(),
  })
}

export function useDispenseHistory(filters: DispenseHistoryFilters, enabled = true) {
  return useQuery({
    enabled,
    placeholderData: keepPreviousData,
    queryKey: dispenseKeys.history(filters),
    queryFn: () => dispenseRepository.searchHistory(filters),
  })
}
