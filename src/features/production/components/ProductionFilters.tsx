import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { productionRoutes } from '../constants'
import type { ProductionFilterValues } from '../hooks/useProductionFilters'
import type { ProductionRoute } from '../types'

interface ProductionFiltersProps {
  filters: ProductionFilterValues
  hasActiveFilters: boolean
  onQueryChange: (query: string) => void
  onRouteChange: (route: ProductionRoute | null) => void
  onReset: () => void
}

export function ProductionFilters({
  filters,
  hasActiveFilters,
  onQueryChange,
  onRouteChange,
  onReset,
}: ProductionFiltersProps) {
  return (
    <section className="production-filters" aria-label="Production filters">
      <FormField label="Search" htmlFor="production-search">
        <Input
          id="production-search"
          type="search"
          value={filters.query}
          placeholder="Article, designation or profile"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </FormField>

      <FormField label="Route" htmlFor="production-route">
        <Select
          id="production-route"
          value={filters.route ?? ''}
          onChange={(event) => onRouteChange((event.target.value || null) as ProductionRoute | null)}
        >
          <option value="">All routes</option>
          {productionRoutes.map((route) => <option key={route} value={route}>{route}</option>)}
        </Select>
      </FormField>

      {hasActiveFilters ? (
        <Button className="production-filters__reset" type="button" variant="secondary" onClick={onReset}>
          Reset Filters
        </Button>
      ) : null}
    </section>
  )
}
