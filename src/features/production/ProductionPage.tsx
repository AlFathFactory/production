import { useState } from 'react'
import type { ReactNode } from 'react'

import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ProductionFilters } from './components/ProductionFilters'
import { ProjectLotSelector } from './components/ProjectLotSelector'
import { ProductionSummary } from './components/ProductionSummary'
import { ProductionTable } from './components/ProductionTable'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { useProductionFilters } from './hooks/useProductionFilters'
import { useProductionItems } from './queries/productionQueries'

function ProductionState({ children }: { children: ReactNode }) {
  return <section className="production-state">{children}</section>
}

export function ProductionPage() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectNumberId, setProjectNumberId] = useState<string | null>(null)
  const [lotId, setLotId] = useState<string | null>(null)
  const productionFilters = useProductionFilters()
  const debouncedQuery = useDebouncedValue(productionFilters.filters.query)
  const itemsQuery = useProductionItems({
    projectId,
    projectNumberId,
    lotId,
    ...productionFilters.filters,
    query: debouncedQuery,
  })

  const selectProject = (nextProjectId: string | null) => {
    setProjectId(nextProjectId)
    setProjectNumberId(null)
    setLotId(null)
  }

  const selectProjectNumber = (nextProjectNumberId: string | null) => {
    setProjectNumberId(nextProjectNumberId)
    setLotId(null)
  }

  return (
    <>
      <PageHeader title="Production" description="View calculated production status for items in a selected lot." />
      <div className="production-workspace">
        <ProjectLotSelector
          projectId={projectId}
          projectNumberId={projectNumberId}
          lotId={lotId}
          onProjectChange={selectProject}
          onProjectNumberChange={selectProjectNumber}
          onLotChange={setLotId}
        />
        <ProductionFilters
          filters={productionFilters.filters}
          hasActiveFilters={productionFilters.hasActiveFilters}
          onQueryChange={productionFilters.setQuery}
          onRouteChange={productionFilters.setRoute}
          onNextActionChange={productionFilters.setNextAction}
          onProgressStateChange={productionFilters.setProgressState}
          onReset={productionFilters.resetFilters}
        />
        {!projectId ? <ProductionState>Select a project to begin.</ProductionState> : null}
        {projectId && !projectNumberId ? <ProductionState>Select a project number.</ProductionState> : null}
        {projectNumberId && !lotId ? <ProductionState>Select a lot to view Production.</ProductionState> : null}
        {lotId && itemsQuery.isPending ? <ProductionState><LoadingSpinner label="Loading production data" /> Loading production data…</ProductionState> : null}
        {lotId && itemsQuery.isError ? (
          <ProductionState>
            <p>Production data could not be loaded. Please try again.</p>
            <Button type="button" variant="secondary" onClick={() => void itemsQuery.refetch()}>Retry</Button>
          </ProductionState>
        ) : null}
        {lotId && itemsQuery.data?.length === 0 ? (
          <ProductionState>
            <p>{productionFilters.hasActiveFilters ? 'No Production items match the current filters.' : 'No Production items are available for this lot.'}</p>
            {productionFilters.hasActiveFilters ? <Button type="button" variant="secondary" onClick={productionFilters.resetFilters}>Reset Filters</Button> : null}
          </ProductionState>
        ) : null}
        {itemsQuery.data && itemsQuery.data.length > 0 ? (
          <section className="production-results" aria-label="Production results">
            <ProductionSummary items={itemsQuery.data} />
            <ProductionTable items={itemsQuery.data} />
          </section>
        ) : null}
      </div>
    </>
  )
}
