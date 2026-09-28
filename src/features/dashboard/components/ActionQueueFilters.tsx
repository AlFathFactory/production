import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import type { DashboardFilters } from '../types'

interface ActionQueueFiltersProps {
  filters: DashboardFilters
  hasActiveFilters: boolean
  routeOptions: string[]
  onRouteChange: (value: string | null) => void
  onSearchChange: (value: string) => void
  onReset: () => void
}

export function ActionQueueFilters({
  filters,
  hasActiveFilters,
  routeOptions,
  onRouteChange,
  onSearchChange,
  onReset,
}: ActionQueueFiltersProps) {
  return (
    <div className="dashboard-filter-stack">
      <section className="action-queue-filters" aria-label="Action queue filters">     
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
