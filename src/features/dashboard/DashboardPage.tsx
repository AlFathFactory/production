import { useState } from 'react'

import { PageHeader } from '../../components/shared/PageHeader'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useDebouncedValue } from '../production/hooks/useDebouncedValue'
import { ActionQueueFilters } from './components/ActionQueueFilters'
import { ActionQueueTable } from './components/ActionQueueTable'
import { DashboardSummary, computeDashboardSummary } from './components/DashboardSummary'
import { LotDashboardTable } from './components/LotDashboardTable'
import { useActionQueue, useLotDashboard } from './queries/dashboardQueries'
import type { DashboardFilters } from './types'

const NEXT_ACTION_OPTIONS = ['CUT', 'OUT_BEND', 'BEND', 'ROLLING', 'DISPENSE', 'COMPLETE']
const ROUTE_OPTIONS = ['BEND', 'NO BEND', 'ROD', 'ROLLING', 'LADDER', 'OTHER']

export function DashboardPage() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectNumberId, setProjectNumberId] = useState<string | null>(null)
  const [lotId, setLotId] = useState<string | null>(null)
  const [nextAction, setNextAction] = useState<string | null>(null)
  const [route, setRoute] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const filters = { lotId, projectId, projectNumberId, nextAction, route, search: debouncedSearch }
  const hasActiveFilters = Boolean(projectId || projectNumberId || lotId || nextAction || route || search.trim())

  const lotDashboardQuery = useLotDashboard(filters)
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

  return (
    <>
      <PageHeader title="Dashboard" description="Operational overview of Production lots and actionable items." />
      <div className="dashboard-workspace">
        <LotDashboardSection
          lotDashboardQuery={lotDashboardQuery}
          projectId={projectId}
          projectNumberId={projectNumberId}
          lotId={lotId}
          onProjectChange={selectProject}
          onProjectNumberChange={selectProjectNumber}
          onLotChange={setLotId}
        />
        <ActionQueueSection
          actionQueueQuery={actionQueueQuery}
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onProjectChange={selectProject}
          onProjectNumberChange={selectProjectNumber}
          onLotChange={setLotId}
          onNextActionChange={setNextAction}
          onRouteChange={setRoute}
          onSearchChange={setSearch}
          onReset={resetFilters}
        />
      </div>
    </>
  )
}

interface LotDashboardSectionProps {
  lotDashboardQuery: ReturnType<typeof useLotDashboard>
  projectId: string | null
  projectNumberId: string | null
  lotId: string | null
  onProjectChange: (value: string | null) => void
  onProjectNumberChange: (value: string | null) => void
  onLotChange: (value: string | null) => void
}

function LotDashboardSection({
  lotDashboardQuery,
  projectId,
  projectNumberId,
  lotId,
  onProjectChange,
  onProjectNumberChange,
  onLotChange,
}: LotDashboardSectionProps) {
  const lots = lotDashboardQuery.data ?? []
  const summary = computeDashboardSummary(lots)

  return (
    <div className="dashboard-section dashboard-section--lot-dashboard">
      <DashboardSummary summary={summary} />
      <div className="dashboard-hierarchy">
        <ProjectLotSelector
          ariaLabel="Dashboard hierarchy filters"
          idPrefix="dashboard"
          lotId={lotId}
          projectId={projectId}
          projectNumberId={projectNumberId}
          onLotChange={(value) => onLotChange(value)}
          onProjectChange={(value) => onProjectChange(value)}
          onProjectNumberChange={(value) => onProjectNumberChange(value)}
        />
      </div>
      {lotDashboardQuery.isPending ? (
        <section className="dashboard-state"><LoadingSpinner label="Loading lot dashboard" /> Loading lot dashboard…</section>
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
  onProjectChange: (value: string | null) => void
  onProjectNumberChange: (value: string | null) => void
  onLotChange: (value: string | null) => void
  onNextActionChange: (value: string | null) => void
  onRouteChange: (value: string | null) => void
  onSearchChange: (value: string) => void
  onReset: () => void
}

function ActionQueueSection({
  actionQueueQuery,
  filters,
  hasActiveFilters,
  onProjectChange,
  onProjectNumberChange,
  onLotChange,
  onNextActionChange,
  onRouteChange,
  onSearchChange,
  onReset,
}: ActionQueueSectionProps) {
  const items = actionQueueQuery.data ?? []

  return (
    <div className="dashboard-section dashboard-section--action-queue">
      <ActionQueueFilters
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        nextActionOptions={NEXT_ACTION_OPTIONS}
        routeOptions={ROUTE_OPTIONS}
        onProjectChange={onProjectChange}
        onProjectNumberChange={onProjectNumberChange}
        onLotChange={onLotChange}
        onNextActionChange={onNextActionChange}
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
    </div>
  )
}

import { ProjectLotSelector } from '../production/components/ProjectLotSelector'
