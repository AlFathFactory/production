import { useState } from 'react'

import type { ProductionRoute } from '../../production/types'
import { reportOperations } from '../constants'
import type { ReportContextLabels, ReportFilters, ReportOperation } from '../types'

const initialFilters: ReportFilters = {
  dateFrom: null,
  dateTo: null,
  projectId: null,
  projectNumberId: null,
  lotId: null,
  operations: [],
  routing: null,
  query: '',
  performedBy: '',
}

const initialLabels: ReportContextLabels = {
  project: '',
  projectNumber: '',
  lot: '',
  performedBy: '',
}

export function useReportFilters() {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const [labels, setLabels] = useState<ReportContextLabels>(initialLabels)
  const hasActiveFilters = Boolean(
    filters.dateFrom
    || filters.dateTo
    || filters.projectId
    || filters.operations.length
    || filters.routing
    || filters.query.trim()
    || filters.performedBy.trim(),
  )

  return {
    filters,
    labels,
    hasActiveFilters,
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
    setProject: (projectId: string | null, label: string | null) => {
      setFilters((current) => ({ ...current, projectId, projectNumberId: null, lotId: null }))
      setLabels((current) => ({ ...current, project: label ?? '', projectNumber: '', lot: '' }))
    },
    setProjectNumber: (projectNumberId: string | null, label: string | null) => {
      setFilters((current) => ({ ...current, projectNumberId, lotId: null }))
      setLabels((current) => ({ ...current, projectNumber: label ?? '', lot: '' }))
    },
    setLot: (lotId: string | null, label: string | null) => {
      setFilters((current) => ({ ...current, lotId }))
      setLabels((current) => ({ ...current, lot: label ?? '' }))
    },
    toggleOperation: (operation: ReportOperation, selected: boolean) => setFilters((current) => ({
      ...current,
      operations: reportOperations.filter((candidate) => (
        candidate === operation ? selected : current.operations.includes(candidate)
      )),
    })),
    setRouting: (routing: ProductionRoute | null) => setFilters((current) => ({ ...current, routing })),
    setQuery: (query: string) => setFilters((current) => ({ ...current, query })),
    setPerformedBy: (performedBy: string, label: string | null) => {
      setFilters((current) => ({ ...current, performedBy }))
      setLabels((current) => ({ ...current, performedBy: label ?? '' }))
    },
    resetFilters: () => {
      setFilters(initialFilters)
      setLabels(initialLabels)
    },
  }
}
