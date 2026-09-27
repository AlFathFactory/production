import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { useDebouncedValue } from '../../production/hooks/useDebouncedValue'
import { useCurrentStatusFilters } from '../hooks/useCurrentStatusFilters'
import { useProductionStatusReport } from '../queries/reportQueries'
import { computeCurrentStatusSummary } from '../utils/currentStatusSummary'
import { CurrentStatusContext } from './CurrentStatusContext'
import { CurrentStatusFilters } from './CurrentStatusFilters'
import { CurrentStatusSummary } from './CurrentStatusSummary'
import { CurrentStatusTable } from './CurrentStatusTable'

export function CurrentStatusReport({ active }: { active: boolean }) {
  const statusFilters = useCurrentStatusFilters()
  const debouncedQuery = useDebouncedValue(statusFilters.filters.query)
  const queryFilters = { ...statusFilters.filters, query: debouncedQuery }
  const reportQuery = useProductionStatusReport(queryFilters, active)
  const rows = reportQuery.data ?? []
  const summary = computeCurrentStatusSummary(rows)
  const hasInitialError = reportQuery.isError && reportQuery.data === undefined

  return (
    <>
      <CurrentStatusFilters
        filters={statusFilters.filters}
        hasActiveFilters={statusFilters.hasActiveFilters}
        onProjectChange={statusFilters.setProject}
        onProjectNumberChange={statusFilters.setProjectNumber}
        onLotChange={statusFilters.setLot}
        onStatusChange={statusFilters.toggleStatus}
        onRoutingChange={statusFilters.setRouting}
        onQueryChange={statusFilters.setQuery}
        onProgressStateChange={statusFilters.setProgressState}
        onReset={statusFilters.resetFilters}
      />
      <CurrentStatusContext filters={queryFilters} labels={statusFilters.labels} />

      {reportQuery.isPending ? (
        <section className="reports-state"><LoadingSpinner label="Loading current status" /> Loading current status...</section>
      ) : null}
      {hasInitialError ? (
        <section className="reports-state reports-state--error">
          <p>{reportQuery.error.message}</p>
          <Button type="button" variant="secondary" onClick={() => void reportQuery.refetch()}>Retry</Button>
        </section>
      ) : null}
      {!hasInitialError && !reportQuery.isPending ? (
        <CurrentStatusSummary summary={summary} isFetching={reportQuery.isFetching} />
      ) : null}
      {!hasInitialError && !reportQuery.isPending && rows.length === 0 ? (
        <section className="reports-state">
          <p>No production items match the current status filters.</p>
          {statusFilters.hasActiveFilters ? <Button type="button" variant="secondary" onClick={statusFilters.resetFilters}>Reset Filters</Button> : null}
        </section>
      ) : null}
      {rows.length > 0 ? (
        <section className="reports-results" aria-label="Current status results" aria-busy={reportQuery.isFetching}>
          <div className="reports-results__heading">
            <h2>Current Production Items</h2>
            <span>{reportQuery.isFetching ? 'Updating report...' : `${rows.length} item${rows.length === 1 ? '' : 's'}`}</span>
          </div>
          {reportQuery.isError ? (
            <div className="reports-refetch-error" role="alert">
              The latest filters could not be loaded. Showing the previous report.
              <button type="button" onClick={() => void reportQuery.refetch()}>Retry</button>
            </div>
          ) : null}
          <CurrentStatusTable rows={rows} statuses={statusFilters.filters.statuses} />
        </section>
      ) : null}
    </>
  )
}
