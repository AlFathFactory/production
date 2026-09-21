import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import type { ProductionSearchRow } from '../../production/types'
import type { WeightRoute } from '../utils/computeOperationalSummary'
import { computeOperationalSummary } from '../utils/computeOperationalSummary'
import { ProductionTotalsCard } from './ProductionTotalsCard'
import './OperationalOverview.css'

interface OperationalOverviewProps {
  items: ProductionSearchRow[]
  route: WeightRoute
  isPending: boolean
  isError: boolean
  errorMessage: string | null
  onRetry: () => void
}

export function OperationalOverview({ items, route, isPending, isError, errorMessage, onRetry }: OperationalOverviewProps) {
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

  if (items.length === 0) {
    return (
      <section className="opc-state" aria-label="Operational overview empty">
        <p>No production data available for the selected scope.</p>
      </section>
    )
  }

  const summary = computeOperationalSummary(items, route)

  return (
    <section className="opc-overview" aria-label="Operational overview">
      <ProductionTotalsCard
        totalWeightKg={summary.totalWeightKg}
        cutWeightKg={summary.cutWeightKg}
        readyForBendWeightKg={summary.readyForBendWeightKg}
        outBendWeightKg={summary.outBendWeightKg}
        bendWeightKg={summary.bendWeightKg}
        awaitingBendReturnWeightKg={summary.awaitingBendReturnWeightKg}
        cutPercent={summary.cutPercent}
        outBendPercent={summary.outBendPercent}
        bendPercent={summary.bendPercent}
        readyForBendPercent={summary.readyForBendPercent}
        awaitingBendReturnPercent={summary.awaitingBendReturnPercent}
        weightsMissing={summary.weightsMissing}
      />
    </section>
  )
}
