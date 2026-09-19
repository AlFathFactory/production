import { formatPcs, formatWeightKg } from '../utils/formatOperational'
import { DashboardCard } from './DashboardCard'
import './ProductionTotalsCard.css'

interface ProductionTotalsCardProps {
  totalQty: number
  totalWeightKg: number
  cutWeightKg: number
  outBendWeightKg: number
  bendWeightKg: number
  weightsMissing: boolean
}

export function ProductionTotalsCard({
  totalQty,
  totalWeightKg,
  cutWeightKg,
  outBendWeightKg,
  bendWeightKg,
  weightsMissing,
}: ProductionTotalsCardProps) {
  return (
    <DashboardCard title="Total Production">
      <dl className="opc-totals">
        <div className="opc-totals__row opc-totals__row--highlight">
          <dt>Total Qty</dt>
          <dd>{formatPcs(totalQty)}</dd>
        </div>
        <div className="opc-totals__row opc-totals__row--highlight">
          <dt>Total Weight</dt>
          <dd>{formatWeightKg(totalWeightKg)}</dd>
        </div>
        <div className="opc-totals__row">
          <dt>Cut Weight</dt>
          <dd>{formatWeightKg(cutWeightKg)}</dd>
        </div>
        <div className="opc-totals__row">
          <dt>Out Bend Weight</dt>
          <dd>{formatWeightKg(outBendWeightKg)}</dd>
        </div>
        <div className="opc-totals__row">
          <dt>Bend Weight</dt>
          <dd>{formatWeightKg(bendWeightKg)}</dd>
        </div>
      </dl>
      {weightsMissing ? (
        <p className="opc-totals__note">Some items have no unit weight — weights are partial.</p>
      ) : null}
    </DashboardCard>
  )
}
