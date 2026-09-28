import { useState } from 'react'

import { PageHeader } from '../../components/shared/PageHeader'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { FormField } from '../../components/ui/FormField'
import { Select } from '../../components/ui/Select'
import { useDebouncedValue } from '../production/hooks/useDebouncedValue'
import { ActionQueueFilters } from './components/ActionQueueFilters'
import { ActionQueueTable } from './components/ActionQueueTable'
import { LotDashboardTable } from './components/LotDashboardTable'
import { OperationalOverview } from './components/OperationalOverview'
import { useActionQueue, useDashboardProductionItems, useLotDashboard } from './queries/dashboardQueries'
import { ProjectLotSelector } from '../production/components/ProjectLotSelector'
import type { DashboardFilters } from './types'
import type { WeightRoute } from './utils/computeOperationalSummary'
import './DashboardPage.css'

const ROUTE_OPTIONS = ['BEND', 'NO BEND', 'ROD', 'ROLLING', 'LADDER', 'OTHER']

export function DashboardPage() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectNumberId, setProjectNumberId] = useState<string | null>(null)
  const [lotId, setLotId] = useState<string | null>(null)
  const [nextAction, setNextAction] = useState<string | null>(null)
  const [route, setRoute] = useState<string | null>(null)
  const [weightRoute, setWeightRoute] = useState<WeightRoute>('ALL')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const filters = { lotId, projectId, projectNumberId, nextAction, route, search: debouncedSearch }
  const hasActiveFilters = Boolean(projectId || projectNumberId || lotId || nextAction || route || search.trim())

  const lotDashboardQuery = useLotDashboard(filters)
  const productionItemsQuery = useDashboardProductionItems({ lotId, projectId, projectNumberId })
  const actionQueueQuery = useActionQueue(filters)

  const selectProject = (value: string | null) => {
    setProjectId(value)
    setProjectNumberId(null)
    setLotId(null)
  }

  const selectProjectNumber = (value: string | null) => {
    setProjectNumberId(value)
    setLotId(null)
  }

  const resetFilters = () => {
    setProjectId(null)
    setProjectNumberId(null)
    setLotId(null)
    setNextAction(null)
    setRoute(null)
    setSearch('')
  }

  const retryOverview = () => void productionItemsQuery.refetch()

  return (
    <>
      <PageHeader title="Dashboard" description="How much production? How much is done? What is remaining? What is next?" />
      <div className="dashboard-workspace">
        <div className="dashboard-hierarchy">
          <ProjectLotSelector
            ariaLabel="Dashboard hierarchy filters"
            idPrefix="dashboard"
            lotId={lotId}
            projectId={projectId}
            projectNumberId={projectNumberId}
            onLotChange={(value) => setLotId(value)}
            onProjectChange={(value) => selectProject(value)}
            onProjectNumberChange={(value) => selectProjectNumber(value)}
          />
        </div>
        <div className="dashboard-weight-filter">
          <FormField label="Weight route" htmlFor="dashboard-weight-route">
            <Select
              id="dashboard-weight-route"
              value={weightRoute}
              onChange={(event) => setWeightRoute(event.target.value as WeightRoute)}
            >
              <option value="ALL">All routes</option>
              <option value="BEND">Bend</option>
              <option value="NO BEND">No Bend</option>
            </Select>
          </FormField>
        </div>
        <OperationalOverview
          items={productionItemsQuery.data ?? []}
          route={weightRoute}
          isPending={productionItemsQuery.isPending}
          isError={productionItemsQuery.isError}
          errorMessage={productionItemsQuery.error?.message ?? null}
          onRetry={retryOverview}
        />
        <LotDetailsSection lotDashboardQuery={lotDashboardQuery} />
        <ActionQueueSection
          actionQueueQuery={actionQueueQuery}
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onRouteChange={setRoute}
          onSearchChange={setSearch}
          onReset={resetFilters}
        />
      </div>
    </>
  )
}

interface LotDetailsSectionProps {
  lotDashboardQuery: ReturnType<typeof useLotDashboard>
}

function LotDetailsSection({ lotDashboardQuery }: LotDetailsSectionProps) {
  const lots = lotDashboardQuery.data ?? []

  return (
    <div className="dashboard-section dashboard-section--lot-dashboard">
      {lotDashboardQuery.isPending ? (
        <section className="dashboard-state"><LoadingSpinner label="Loading lot dashboard" /> Loading lot details…</section>
      ) : lotDashboardQuery.isError ? (
        <section className="dashboard-state dashboard-state--error" role="alert">
          <p>{lotDashboardQuery.error.message}</p>
          <button type="button" className="button button--secondary" onClick={() => void lotDashboardQuery.refetch()}>Retry</button>
        </section>
      ) : lots.length === 0 ? (
        <section className="dashboard-state">
          <p>No dashboard data available.</p>
        </section>
      ) : (
        <LotDashboardTable lots={lots} />
      )}
    </div>
  )
}

interface ActionQueueSectionProps {
  actionQueueQuery: ReturnType<typeof useActionQueue>
  filters: DashboardFilters
  hasActiveFilters: boolean
  onRouteChange: (value: string | null) => void
  onSearchChange: (value: string) => void
  onReset: () => void
}

function ActionQueueSection({
  actionQueueQuery,
  filters,
  hasActiveFilters,
  onRouteChange,
  onSearchChange,
  onReset,
}: ActionQueueSectionProps) {
  const items = actionQueueQuery.data ?? []

  return (
    <details className="dashboard-section dashboard-section--action-queue">
      <summary className="dashboard-secondary-toggle">Detailed item filters and queue</summary>
      <ActionQueueFilters
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        routeOptions={ROUTE_OPTIONS}
        onRouteChange={onRouteChange}
        onSearchChange={onSearchChange}
        onReset={onReset}
      />
      {actionQueueQuery.isPending ? (
        <section className="dashboard-state"><LoadingSpinner label="Loading action queue" /> Loading action queue…</section>
      ) : actionQueueQuery.isError ? (
        <section className="dashboard-state dashboard-state--error" role="alert">
          <p>{actionQueueQuery.error.message}</p>
          <button type="button" className="button button--secondary" onClick={() => void actionQueueQuery.refetch()}>Retry</button>
        </section>
      ) : items.length === 0 ? (
        <section className="dashboard-state">
          <p>{hasActiveFilters ? 'No items match the current filters.' : 'No pending production actions.'}</p>
          {hasActiveFilters ? <button type="button" className="button button--secondary" onClick={onReset}>Reset Filters</button> : null}
        </section>
      ) : (
        <ActionQueueTable items={items} />
      )}
    </details>
  )
}
