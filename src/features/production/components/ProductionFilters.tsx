import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { productionNextActions, productionProgressStates, productionRoutes, progressStateLabels } from '../constants'
import type { ProductionFilterValues } from '../hooks/useProductionFilters'
import type { ProductionNextAction, ProductionProgressState, ProductionRoute } from '../types'

interface ProductionFiltersProps {
  filters: ProductionFilterValues
  hasActiveFilters: boolean
  onQueryChange: (query: string) => void
  onRouteChange: (route: ProductionRoute | null) => void
  onNextActionChange: (nextAction: ProductionNextAction | null) => void
  onProgressStateChange: (progressState: ProductionProgressState | null) => void
  onReset: () => void
}

export function ProductionFilters({
  filters,
  hasActiveFilters,
  onQueryChange,
  onRouteChange,
  onNextActionChange,
  onProgressStateChange,
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

      <FormField label="Next Action" htmlFor="production-next-action">
        <Select
          id="production-next-action"
          value={filters.nextAction ?? ''}
          onChange={(event) => onNextActionChange((event.target.value || null) as ProductionNextAction | null)}
        >
          <option value="">All actions</option>
          {productionNextActions.map((action) => <option key={action} value={action}>{action}</option>)}
        </Select>
      </FormField>

      <FormField label="Progress" htmlFor="production-progress">
        <Select
          id="production-progress"
          value={filters.progressState ?? ''}
          onChange={(event) => onProgressStateChange((event.target.value || null) as ProductionProgressState | null)}
        >
          <option value="">All progress</option>
          {productionProgressStates.map((state) => <option key={state} value={state}>{progressStateLabels[state]}</option>)}
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
