import './Reports.css'

import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useDebouncedValue } from '../production/hooks/useDebouncedValue'
import { ReportContext } from './components/ReportContext'
import { ReportsFilters } from './components/ReportsFilters'
import { ReportsTable } from './components/ReportsTable'
import { useReportFilters } from './hooks/useReportFilters'
import { useProductionOperationsReport } from './queries/reportQueries'

export function ReportsPage() {
  const reportFilters = useReportFilters()
  const debouncedQuery = useDebouncedValue(reportFilters.filters.query)
  const debouncedPerformedBy = useDebouncedValue(reportFilters.filters.performedBy)
  const queryFilters = {
    ...reportFilters.filters,
    query: debouncedQuery,
    performedBy: debouncedPerformedBy,
  }
  const reportQuery = useProductionOperationsReport(queryFilters)
  const rows = reportQuery.data ?? []
  const hasInitialError = reportQuery.isError && reportQuery.data === undefined

  return (
    <>
      <PageHeader
        title="Reports"
        description="Review saved Production operations using the authoritative report data."
      />
      <div className="reports-workspace">
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
        <ReportContext filters={reportFilters.filters} labels={reportFilters.labels} />

        {reportQuery.isPending ? (
          <section className="reports-state"><LoadingSpinner label="Loading report" /> Loading report…</section>
        ) : null}
        {hasInitialError ? (
          <section className="reports-state reports-state--error">
            <p>{reportQuery.error.message}</p>
            <Button type="button" variant="secondary" onClick={() => void reportQuery.refetch()}>Retry</Button>
          </section>
        ) : null}
        {!hasInitialError && !reportQuery.isPending && rows.length === 0 ? (
          <section className="reports-state">
            <p>No saved operations match the current report filters.</p>
            {reportFilters.hasActiveFilters ? <Button type="button" variant="secondary" onClick={reportFilters.resetFilters}>Reset Filters</Button> : null}
          </section>
        ) : null}
        {rows.length > 0 ? (
          <section className="reports-results" aria-label="Report results" aria-busy={reportQuery.isFetching}>
            <div className="reports-results__heading">
              <h2>Operations</h2>
              <span>{reportQuery.isFetching ? 'Updating report…' : `${rows.length} operation${rows.length === 1 ? '' : 's'}`}</span>
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
      </div>
    </>
  )
}
