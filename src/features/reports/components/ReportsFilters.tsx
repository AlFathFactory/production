import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { productionRoutes } from '../../production/constants'
import { ProjectLotSelector } from '../../production/components/ProjectLotSelector'
import type { ProductionRoute } from '../../production/types'
import { useUsers } from '../../users/queries/userQueries'
import { reportOperationLabels, reportOperations } from '../constants'
import type { ReportFilters, ReportOperation } from '../types'

interface ReportsFiltersProps {
  filters: ReportFilters
  hasActiveFilters: boolean
  onDateFromChange: (value: string | null) => void
  onDateToChange: (value: string | null) => void
  onProjectChange: (id: string | null, label: string | null) => void
  onProjectNumberChange: (id: string | null, label: string | null) => void
  onLotChange: (id: string | null, label: string | null) => void
  onOperationChange: (operation: ReportOperation, selected: boolean) => void
  onRoutingChange: (routing: ProductionRoute | null) => void
  onQueryChange: (query: string) => void
  onPerformedByChange: (performedBy: string) => void
  onReset: () => void
}

export function ReportsFilters({
  filters,
  hasActiveFilters,
  onDateFromChange,
  onDateToChange,
  onProjectChange,
  onProjectNumberChange,
  onLotChange,
  onOperationChange,
  onRoutingChange,
  onQueryChange,
  onPerformedByChange,
  onReset,
}: ReportsFiltersProps) {
  const usersQuery = useUsers({ search: '' })
  const performers = (usersQuery.data ?? []).filter((user) => user.isActive)
  const operationsSummary = filters.operations.length === 0
    ? 'All Operations'
    : `${filters.operations.length} selected`

  return (
    <section className="reports-filter-panel" aria-label="Report filters">
      <div className="reports-filter-grid">
        <FormField label="Date From" htmlFor="reports-date-from">
          <Input
            id="reports-date-from"
            type="date"
            max={filters.dateTo ?? undefined}
            value={filters.dateFrom ?? ''}
            onChange={(event) => onDateFromChange(event.target.value || null)}
          />
        </FormField>
        <FormField label="Date To" htmlFor="reports-date-to">
          <Input
            id="reports-date-to"
            type="date"
            min={filters.dateFrom ?? undefined}
            value={filters.dateTo ?? ''}
            onChange={(event) => onDateToChange(event.target.value || null)}
          />
        </FormField>
      </div>

      <ProjectLotSelector
        ariaLabel="Report hierarchy filters"
        idPrefix="reports"
        projectId={filters.projectId}
        projectNumberId={filters.projectNumberId}
        lotId={filters.lotId}
        onProjectChange={onProjectChange}
        onProjectNumberChange={onProjectNumberChange}
        onLotChange={onLotChange}
        emptyOptionLabels={{ project: 'All Projects', projectNumber: 'All Project Numbers', lot: 'All Lots' }}
      />

      <div className="reports-filter-grid reports-filter-grid--details">
        <FormField label="Operations" htmlFor="reports-operations">
          <details className="reports-operation-picker">
            <summary id="reports-operations">{operationsSummary}</summary>
            <div className="reports-operation-picker__options">
              {reportOperations.map((operation) => (
                <label key={operation}>
                  <input
                    type="checkbox"
                    checked={filters.operations.includes(operation)}
                    onChange={(event) => onOperationChange(operation, event.target.checked)}
                  />
                  <span>{reportOperationLabels[operation]}</span>
                </label>
              ))}
            </div>
          </details>
        </FormField>
        <FormField label="Routing" htmlFor="reports-routing">
          <Select
            id="reports-routing"
            value={filters.routing ?? ''}
            onChange={(event) => onRoutingChange((event.target.value || null) as ProductionRoute | null)}
          >
            <option value="">All Routings</option>
            {productionRoutes.map((route) => <option key={route} value={route}>{route}</option>)}
          </Select>
        </FormField>
        <FormField label="Article / Designation / Profile" htmlFor="reports-query">
          <Input
            id="reports-query"
            type="search"
            placeholder="Search production items"
            value={filters.query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </FormField>
        <FormField label="Performed By" htmlFor="reports-performed-by">
          <Select
            id="reports-performed-by"
            value={filters.performedBy}
            onChange={(event) => onPerformedByChange(event.target.value)}
            disabled={usersQuery.isLoading}
          >
            <option value="">
              {usersQuery.isLoading
                ? 'Loading performers…'
                : performers.length === 0
                  ? 'No performers available'
                  : 'All Performers'}
            </option>
            {performers.map((performer) => (
              <option key={performer.id} value={performer.id}>{performer.fullName}</option>
            ))}
          </Select>
          {usersQuery.isError ? (
            <p className="reports-filter-error" role="alert">
              Performers could not be loaded. <button type="button" onClick={() => void usersQuery.refetch()}>Retry</button>
            </p>
          ) : null}
        </FormField>
      </div>

      {hasActiveFilters ? (
        <Button className="reports-filters__reset" type="button" variant="secondary" onClick={onReset}>
          Reset Filters
        </Button>
      ) : null}
    </section>
  )
}
