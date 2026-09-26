import { reportOperationLabels } from '../constants'
import type { ReportContextLabels, ReportFilters } from '../types'

function formatReportDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function periodLabel(dateFrom: string | null, dateTo: string | null): string {
  if (!dateFrom && !dateTo) return 'All Dates'
  if (dateFrom && dateTo) {
    return dateFrom === dateTo
      ? formatReportDate(dateFrom)
      : `${formatReportDate(dateFrom)} → ${formatReportDate(dateTo)}`
  }
  return dateFrom ? `From ${formatReportDate(dateFrom)}` : `Through ${formatReportDate(dateTo!)}`
}

interface ReportContextProps {
  filters: ReportFilters
  labels: ReportContextLabels
}

export function ReportContext({ filters, labels }: ReportContextProps) {
  const operations = filters.operations.length === 0
    ? 'All Operations'
    : filters.operations.map((operation) => reportOperationLabels[operation]).join(', ')

  return (
    <section className="report-context" aria-labelledby="report-context-title">
      <h2 id="report-context-title">Report Context</h2>
      <dl>
        <div><dt>Period</dt><dd>{periodLabel(filters.dateFrom, filters.dateTo)}</dd></div>
        <div><dt>Project</dt><dd>{labels.project || 'All Projects'}</dd></div>
        <div><dt>Project Number</dt><dd>{labels.projectNumber || 'All Project Numbers'}</dd></div>
        <div><dt>Lot</dt><dd>{labels.lot || 'All Lots'}</dd></div>
        <div><dt>Operations</dt><dd>{operations}</dd></div>
      </dl>
    </section>
  )
}
