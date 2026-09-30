import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { useDispenseHistoryFilters } from '../../dispense/hooks/useDispenseHistoryFilters'
import { useDispenseHistory } from '../../dispense/queries/dispenseQueries'
import { useDebouncedValue } from '../../production/hooks/useDebouncedValue'
import { DispenseHistoryFilters } from './DispenseHistoryFilters'
import { DispenseHistoryTable } from './DispenseHistoryTable'

export function DispenseHistoryReport({ active }: { active: boolean }) {
  const historyFilters = useDispenseHistoryFilters()
  const debouncedRecipientName = useDebouncedValue(historyFilters.filters.recipientName)
  const debouncedQuery = useDebouncedValue(historyFilters.filters.query)
  const queryFilters = {
    ...historyFilters.filters,
    recipientName: debouncedRecipientName,
    query: debouncedQuery,
  }
  const historyQuery = useDispenseHistory(queryFilters, active)
  const rows = historyQuery.data ?? []
  const hasInitialError = historyQuery.isError && historyQuery.data === undefined

  return (
    <>
      <DispenseHistoryFilters
        filters={historyFilters.filters}
        hasActiveFilters={historyFilters.hasActiveFilters}
        onDateFromChange={historyFilters.setDateFrom}
        onDateToChange={historyFilters.setDateTo}
        onLotChange={historyFilters.setLot}
        onProjectChange={historyFilters.setProject}
        onProjectNumberChange={historyFilters.setProjectNumber}
        onQueryChange={historyFilters.setQuery}
        onRecipientChange={historyFilters.setRecipient}
        onRecipientNameChange={historyFilters.setRecipientName}
        onReset={historyFilters.resetFilters}
        recipientDisplayName={historyFilters.recipientDisplayName}
      />
      {historyQuery.isPending ? <section className="reports-state"><LoadingSpinner label="Loading DISPENSE history" /> Loading DISPENSE history...</section> : null}
      {hasInitialError ? (
        <section className="reports-state reports-state--error">
          <p>{historyQuery.error.message}</p>
          <Button type="button" variant="secondary" onClick={() => void historyQuery.refetch()}>Retry</Button>
        </section>
      ) : null}
      {!hasInitialError && !historyQuery.isPending && rows.length === 0 ? (
        <section className="reports-state">
          <p>No DISPENSE history matches the current filters.</p>
          {historyFilters.hasActiveFilters ? <Button type="button" variant="secondary" onClick={historyFilters.resetFilters}>Reset Filters</Button> : null}
        </section>
      ) : null}
      {rows.length > 0 ? (
        <section className="reports-results" aria-label="DISPENSE history results" aria-busy={historyQuery.isFetching}>
          <div className="reports-results__heading">
            <h2>DISPENSE History</h2>
            <span>{historyQuery.isFetching ? 'Updating history...' : `${rows.length} item${rows.length === 1 ? '' : 's'}`}</span>
          </div>
          {historyQuery.isError ? (
            <div className="reports-refetch-error" role="alert">
              The latest filters could not be loaded. Showing the previous results.
              <button type="button" onClick={() => void historyQuery.refetch()}>Retry</button>
            </div>
          ) : null}
          <DispenseHistoryTable rows={rows} />
        </section>
      ) : null}
    </>
  )
}
