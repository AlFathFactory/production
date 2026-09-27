import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { ProjectLotSelector } from '../../production/components/ProjectLotSelector'
import { productionProgressStates, productionRoutes, progressStateLabels } from '../../production/constants'
import type { ProductionProgressState, ProductionRoute } from '../../production/types'
import { currentStatusLabels, currentStatuses } from '../constants'
import type { CurrentStatus, CurrentStatusFilters as CurrentStatusFilterValues } from '../types'

interface CurrentStatusFiltersProps {
  filters: CurrentStatusFilterValues
  hasActiveFilters: boolean
  onProjectChange: (id: string | null, label: string | null) => void
  onProjectNumberChange: (id: string | null, label: string | null) => void
  onLotChange: (id: string | null, label: string | null) => void
  onStatusChange: (status: CurrentStatus, selected: boolean) => void
  onRoutingChange: (routing: ProductionRoute | null) => void
  onQueryChange: (query: string) => void
  onProgressStateChange: (progressState: ProductionProgressState | null) => void
  onReset: () => void
}

export function CurrentStatusFilters({
  filters,
  hasActiveFilters,
  onProjectChange,
  onProjectNumberChange,
  onLotChange,
  onStatusChange,
  onRoutingChange,
  onQueryChange,
  onProgressStateChange,
  onReset,
}: CurrentStatusFiltersProps) {
  const statusSummary = filters.statuses.length === 0
    ? 'All Statuses'
    : `${filters.statuses.length} selected`

  return (
    <section className="reports-filter-panel" aria-label="Current status report filters">
      <ProjectLotSelector
        ariaLabel="Current status hierarchy filters"
        idPrefix="current-status-reports"
        projectId={filters.projectId}
        projectNumberId={filters.projectNumberId}
        lotId={filters.lotId}
        onProjectChange={onProjectChange}
        onProjectNumberChange={onProjectNumberChange}
        onLotChange={onLotChange}
        emptyOptionLabels={{ project: 'All Projects', projectNumber: 'All Project Numbers', lot: 'All Lots' }}
      />

      <div className="reports-filter-grid reports-filter-grid--details">
        <FormField label="Statuses" htmlFor="current-status-reports-statuses">
          <details className="reports-operation-picker">
            <summary id="current-status-reports-statuses">{statusSummary}</summary>
            <div className="reports-operation-picker__options reports-operation-picker__options--wide">
              {currentStatuses.map((status) => (
                <label key={status}>
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(status)}
                    onChange={(event) => onStatusChange(status, event.target.checked)}
                  />
                  <span>{currentStatusLabels[status]}</span>
                </label>
              ))}
            </div>
          </details>
        </FormField>
        <FormField label="Routing" htmlFor="current-status-reports-routing">
          <Select
            id="current-status-reports-routing"
            value={filters.routing ?? ''}
            onChange={(event) => onRoutingChange((event.target.value || null) as ProductionRoute | null)}
          >
            <option value="">All Routes</option>
            {productionRoutes.map((route) => <option key={route} value={route}>{route}</option>)}
          </Select>
        </FormField>
        <FormField label="Article / Designation / Profile / Material" htmlFor="current-status-reports-query">
          <Input
            id="current-status-reports-query"
            type="search"
            placeholder="Search current production items"
            value={filters.query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </FormField>
        <FormField label="Progress State" htmlFor="current-status-reports-progress">
          <Select
            id="current-status-reports-progress"
            value={filters.progressState ?? ''}
            onChange={(event) => onProgressStateChange((event.target.value || null) as ProductionProgressState | null)}
          >
            <option value="">All Progress States</option>
            {productionProgressStates.map((state) => (
              <option key={state} value={state}>{progressStateLabels[state]}</option>
            ))}
          </Select>
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
