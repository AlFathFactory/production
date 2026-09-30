import { useState } from 'react'

import type { DispenseHistoryFilters } from '../types'

const initialFilters: DispenseHistoryFilters = {
  recipientId: null,
  recipientName: '',
  dateFrom: null,
  dateTo: null,
  projectId: null,
  projectNumberId: null,
  lotId: null,
  query: '',
}

export function useDispenseHistoryFilters() {
  const [filters, setFilters] = useState<DispenseHistoryFilters>(initialFilters)
  const [recipientDisplayName, setRecipientDisplayName] = useState('')
  const hasActiveFilters = Boolean(
    filters.recipientId
    || filters.recipientName.trim()
    || filters.dateFrom
    || filters.dateTo
    || filters.projectId
    || filters.projectNumberId
    || filters.lotId
    || filters.query.trim(),
  )

  return {
    filters,
    hasActiveFilters,
    recipientDisplayName,
    setRecipient: (recipientId: string | null, displayName: string) => {
      setFilters((current) => ({ ...current, recipientId }))
      setRecipientDisplayName(displayName)
    },
    setRecipientName: (recipientName: string) => setFilters((current) => ({ ...current, recipientName })),
    setDateFrom: (dateFrom: string | null) => setFilters((current) => ({
      ...current,
      dateFrom,
      dateTo: dateFrom && current.dateTo && dateFrom > current.dateTo ? dateFrom : current.dateTo,
    })),
    setDateTo: (dateTo: string | null) => setFilters((current) => ({
      ...current,
      dateFrom: dateTo && current.dateFrom && dateTo < current.dateFrom ? dateTo : current.dateFrom,
      dateTo,
    })),
    setProject: (projectId: string | null) => setFilters((current) => ({
      ...current,
      projectId,
      projectNumberId: null,
      lotId: null,
    })),
    setProjectNumber: (projectNumberId: string | null) => setFilters((current) => ({
      ...current,
      projectNumberId,
      lotId: null,
    })),
    setLot: (lotId: string | null) => setFilters((current) => ({ ...current, lotId })),
    setQuery: (query: string) => setFilters((current) => ({ ...current, query })),
    resetFilters: () => {
      setFilters(initialFilters)
      setRecipientDisplayName('')
    },
  }
}
