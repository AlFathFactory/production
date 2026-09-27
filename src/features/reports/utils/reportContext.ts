import { reportOperationLabels } from '../constants'
import type { ReportContextData, ReportContextLabels, ReportFilters } from '../types'

function formatContextDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function formatPeriod(dateFrom: string | null, dateTo: string | null): string {
  if (!dateFrom && !dateTo) return 'All Dates'
  if (dateFrom && dateTo) {
    return dateFrom === dateTo
      ? formatContextDate(dateFrom)
      : `${formatContextDate(dateFrom)} - ${formatContextDate(dateTo)}`
  }
  return dateFrom ? `From ${formatContextDate(dateFrom)}` : `Through ${formatContextDate(dateTo!)}`
}

export function buildReportContext(
  filters: ReportFilters,
  labels: ReportContextLabels,
): ReportContextData {
  return {
    period: formatPeriod(filters.dateFrom, filters.dateTo),
    project: labels.project || 'All Projects',
    projectNumber: labels.projectNumber || 'All Project Numbers',
    lot: labels.lot || 'All Lots',
    operations: filters.operations.length === 0
      ? 'All Operations'
      : filters.operations.map((operation) => reportOperationLabels[operation]).join(', '),
    routing: filters.routing,
    performedBy: filters.performedBy ? labels.performedBy || 'Selected Performer' : null,
    searchText: filters.query.trim() || null,
  }
}
