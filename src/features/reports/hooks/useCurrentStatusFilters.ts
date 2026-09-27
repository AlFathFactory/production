import { useState } from 'react'

import type { ProductionProgressState, ProductionRoute } from '../../production/types'
import { currentStatuses } from '../constants'
import type {
  CurrentStatus,
  CurrentStatusContextLabels,
  CurrentStatusFilters,
} from '../types'

const initialFilters: CurrentStatusFilters = {
  projectId: null,
  projectNumberId: null,
  lotId: null,
  statuses: [],
  routing: null,
  query: '',
  progressState: null,
}

const initialLabels: CurrentStatusContextLabels = {
  project: '',
  projectNumber: '',
  lot: '',
}

export function useCurrentStatusFilters() {
  const [filters, setFilters] = useState<CurrentStatusFilters>(initialFilters)
  const [labels, setLabels] = useState<CurrentStatusContextLabels>(initialLabels)
  const hasActiveFilters = Boolean(
    filters.projectId
    || filters.statuses.length
    || filters.routing
    || filters.query.trim()
    || filters.progressState,
  )

  return {
    filters,
    labels,
    hasActiveFilters,
    setProject: (projectId: string | null, label: string | null) => {
      setFilters((current) => ({ ...current, projectId, projectNumberId: null, lotId: null }))
      setLabels({ project: label ?? '', projectNumber: '', lot: '' })
    },
    setProjectNumber: (projectNumberId: string | null, label: string | null) => {
      setFilters((current) => ({ ...current, projectNumberId, lotId: null }))
      setLabels((current) => ({ ...current, projectNumber: label ?? '', lot: '' }))
    },
    setLot: (lotId: string | null, label: string | null) => {
      setFilters((current) => ({ ...current, lotId }))
      setLabels((current) => ({ ...current, lot: label ?? '' }))
    },
    toggleStatus: (status: CurrentStatus, selected: boolean) => setFilters((current) => ({
      ...current,
      statuses: currentStatuses.filter((candidate) => (
        candidate === status ? selected : current.statuses.includes(candidate)
      )),
    })),
    setRouting: (routing: ProductionRoute | null) => setFilters((current) => ({ ...current, routing })),
    setQuery: (query: string) => setFilters((current) => ({ ...current, query })),
    setProgressState: (progressState: ProductionProgressState | null) => setFilters((current) => ({
      ...current,
      progressState,
    })),
    resetFilters: () => {
      setFilters(initialFilters)
      setLabels(initialLabels)
    },
  }
}
