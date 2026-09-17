import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { ProjectLotSelector } from '../../production/components/ProjectLotSelector'
import type { DashboardFilters } from '../types'

interface ActionQueueFiltersProps {
  filters: DashboardFilters
  hasActiveFilters: boolean
  nextActionOptions: string[]
  routeOptions: string[]
  onProjectChange: (value: string | null) => void
  onProjectNumberChange: (value: string | null) => void
  onLotChange: (value: string | null) => void
  onNextActionChange: (value: string | null) => void
  onRouteChange: (value: string | null) => void
  onSearchChange: (value: string) => void
  onReset: () => void
}

export function ActionQueueFilters({
  filters,
  hasActiveFilters,
  nextActionOptions,
  routeOptions,
  onProjectChange,
  onProjectNumberChange,
  onLotChange,
  onNextActionChange,
  onRouteChange,
  onSearchChange,
  onReset,
}: ActionQueueFiltersProps) {
  return (
    <div className="dashboard-filter-stack">
      <ProjectLotSelector
        ariaLabel="Action queue hierarchy filters"
        idPrefix="dashboard"
        lotId={filters.lotId}
        projectId={filters.projectId}
        projectNumberId={filters.projectNumberId}
        onLotChange={(value) => onLotChange(value)}
        onProjectChange={(value) => onProjectChange(value)}
        onProjectNumberChange={(value) => onProjectNumberChange(value)}
      />
      <section className="action-queue-filters" aria-label="Action queue filters">
        <FormField label="Next Action" htmlFor="action-queue-next-action-filter">
          <Select id="action-queue-next-action-filter" value={filters.nextAction ?? ''} onChange={(event) => onNextActionChange(event.target.value || null)}>
            <option value="">All next actions</option>
            {nextActionOptions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Route" htmlFor="action-queue-route-filter">
          <Select id="action-queue-route-filter" value={filters.route ?? ''} onChange={(event) => onRouteChange(event.target.value || null)}>
            <option value="">All routes</option>
            {routeOptions.map((route) => (
              <option key={route} value={route}>{route}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Text Search" htmlFor="action-queue-search-filter">
          <Input id="action-queue-search-filter" placeholder="Search by article" type="search" value={filters.search} onChange={(event) => onSearchChange(event.target.value)} />
        </FormField>
        {hasActiveFilters ? <Button className="action-queue-filters__reset" type="button" variant="secondary" onClick={onReset}>Reset Filters</Button> : null}
      </section>
    </div>
  )
}