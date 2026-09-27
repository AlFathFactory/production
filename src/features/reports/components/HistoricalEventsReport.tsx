import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { useAuth } from '../../auth/hooks/useAuth'
import { useDebouncedValue } from '../../production/hooks/useDebouncedValue'
import { useReportFilters } from '../hooks/useReportFilters'
import { useProductionOperationsReport } from '../queries/reportQueries'
import { buildReportContext } from '../utils/reportContext'
import { computeReportSummary } from '../utils/reportSummary'
import { GenerateReportPdfButton } from './GenerateReportPdfButton'
import { ReportContext } from './ReportContext'
import { ReportsFilters } from './ReportsFilters'
import { ReportSummary } from './ReportSummary'
import { ReportsTable } from './ReportsTable'

export function HistoricalEventsReport({ active }: { active: boolean }) {
  const { userProfile } = useAuth()
  const reportFilters = useReportFilters()
  const debouncedQuery = useDebouncedValue(reportFilters.filters.query)
  const debouncedPerformedBy = useDebouncedValue(reportFilters.filters.performedBy)
  const queryFilters = {
    ...reportFilters.filters,
    query: debouncedQuery,
    performedBy: debouncedPerformedBy,
  }
  const reportQuery = useProductionOperationsReport(queryFilters, active)
  const rows = reportQuery.data ?? []
  const summary = computeReportSummary(rows)
  const context = buildReportContext(queryFilters, reportFilters.labels)
  const hasInitialError = reportQuery.isError && reportQuery.data === undefined
  const hasPendingTextFilters = (
    reportFilters.filters.query !== debouncedQuery
    || reportFilters.filters.performedBy !== debouncedPerformedBy
  )
  const isReportChanging = reportQuery.isFetching || hasPendingTextFilters
  const pdfDisabledReason = rows.length === 0
    ? 'There are no report results to export.'
    : isReportChanging
      ? 'Wait for the current report filters to finish applying.'
      : ''

  return (
    <>
      <div className="reports-mode-actions">
        <GenerateReportPdfButton
          context={context}
          dateFrom={queryFilters.dateFrom}
          dateTo={queryFilters.dateTo}
          disabled={rows.length === 0 || isReportChanging}
          disabledReason={pdfDisabledReason}
          generatedBy={userProfile?.full_name ?? 'Production Control User'}
          rows={rows}
          summary={summary}
        />
      </div>
      <ReportsFilters
        filters={reportFilters.filters}
        hasActiveFilters={reportFilters.hasActiveFilters}
        onDateFromChange={reportFilters.setDateFrom}
        onDateToChange={reportFilters.setDateTo}
        onProjectChange={reportFilters.setProject}
        onProjectNumberChange={reportFilters.setProjectNumber}
        onLotChange={reportFilters.setLot}
        onOperationChange={reportFilters.toggleOperation}
        onRoutingChange={reportFilters.setRouting}
        onQueryChange={reportFilters.setQuery}
        onPerformedByChange={reportFilters.setPerformedBy}
        onReset={reportFilters.resetFilters}
      />
      <ReportContext context={context} />

      {reportQuery.isPending ? (
        <section className="reports-state"><LoadingSpinner label="Loading report" /> Loading report...</section>
      ) : null}
      {hasInitialError ? (
        <section className="reports-state reports-state--error">
          <p>{reportQuery.error.message}</p>
          <Button type="button" variant="secondary" onClick={() => void reportQuery.refetch()}>Retry</Button>
        </section>
      ) : null}
      {!hasInitialError && !reportQuery.isPending ? (
        <ReportSummary summary={summary} isFetching={reportQuery.isFetching} />
      ) : null}
      {!hasInitialError && !reportQuery.isPending && rows.length === 0 ? (
        <section className="reports-state">
          <p>No saved operations match the current report filters.</p>
          {reportFilters.hasActiveFilters ? <Button type="button" variant="secondary" onClick={reportFilters.resetFilters}>Reset Filters</Button> : null}
        </section>
      ) : null}
      {rows.length > 0 ? (
        <section className="reports-results" aria-label="Historical event results" aria-busy={reportQuery.isFetching}>
          <div className="reports-results__heading">
            <h2>Operations</h2>
            <span>{reportQuery.isFetching ? 'Updating report...' : `${rows.length} operation${rows.length === 1 ? '' : 's'}`}</span>
          </div>
          {reportQuery.isError ? (
            <div className="reports-refetch-error" role="alert">
              The latest filters could not be loaded. Showing the previous report.
              <button type="button" onClick={() => void reportQuery.refetch()}>Retry</button>
            </div>
          ) : null}
          <ReportsTable rows={rows} />
        </section>
      ) : null}
    </>
  )
}
