import { useQuery } from '@tanstack/react-query'

import { documentsRepository } from '../documentsRepository'
import type { DocumentsFilters } from '../types'

export const documentKeys = {
  all: ['documents'] as const,
  register: (filters: DocumentsFilters) => [...documentKeys.all, 'register', filters] as const,
}

export function useDocuments(filters: DocumentsFilters) {
  return useQuery({
    queryKey: documentKeys.register(filters),
    queryFn: () => documentsRepository.listDocuments(filters),
  })
}
