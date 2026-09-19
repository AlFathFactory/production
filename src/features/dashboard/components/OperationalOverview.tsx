import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import type { ProductionSearchRow } from '../../production/types'
import type { LotDashboardItem } from '../types'
import { computeOperationalSummary } from '../utils/computeOperationalSummary'
import { NextOperationsCards } from './NextOperationsCards'
import { ProductionTotalsCard } from './ProductionTotalsCard'
import { StageProgressCards } from './StageProgressCards'
import './OperationalOverview.css'

interface OperationalOverviewProps {
  lots: LotDashboardItem[]
  items: ProductionSearchRow[]
  isPending: boolean
  isError: boolean
  errorMessage: string | null
  onRetry: () => void
}

export function OperationalOverview({ lots, items, isPending, isError, errorMessage, onRetry }: OperationalOverviewProps) {
  if (isPending) {
    return (
      <section className="opc-state" aria-label="Operational overview loading">
        <LoadingSpinner label="Loading operational overview" /> Loading operational overview…
      </section>
    )
  }

  if (isError) {
    return (
      <section className="opc-state opc-state--error" role="alert" aria-label="Operational overview error">
        <p>{errorMessage ?? 'Operational overview could not be loaded.'}</p>
        <button type="button" className="button button--secondary" onClick={onRetry}>Retry</button>
      </section>
    )
  }

  if (lots.length === 0) {
    return (
      <section className="opc-state" aria-label="Operational overview empty">
        <p>No production data available for the selected scope.</p>
      </section>
    )
  }

  const summary = computeOperationalSummary(lots, items)

  return (
    <section className="opc-overview" aria-label="Operational overview">
      <ProductionTotalsCard
        totalQty={summary.totalQty}
        totalWeightKg={summary.totalWeightKg}
        cutWeightKg={summary.cutWeightKg}
        outBendWeightKg={summary.outBendWeightKg}
        bendWeightKg={summary.bendWeightKg}
        weightsMissing={summary.weightsMissing}
      />
      <StageProgressCards stages={summary.stageProgress} />
      <NextOperationsCards operations={summary.nextOperations} />
    </section>
  )
}
