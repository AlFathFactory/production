import { formatWeightKg } from '../utils/formatOperational'
import { DashboardCard } from './DashboardCard'
import './ProductionTotalsCard.css'

interface ProductionTotalsCardProps {
  totalWeightKg: number
  cutWeightKg: number
  readyForBendWeightKg: number
  outBendWeightKg: number
  bendWeightKg: number
  awaitingBendReturnWeightKg: number
  weightsMissing: boolean
}

export function ProductionTotalsCard({
  totalWeightKg,
  cutWeightKg,
  readyForBendWeightKg,
  outBendWeightKg,
  bendWeightKg,
  awaitingBendReturnWeightKg,
  weightsMissing,
}: ProductionTotalsCardProps) {
  return (
    <DashboardCard title="Production weights">
      <dl className="opc-totals">
        <div className="opc-totals__priority">
          <dt>Ready to send for bending</dt>
          <dd>{formatWeightKg(readyForBendWeightKg)}</dd>
          <p>Cut and not yet sent out</p>
        </div>
        <div className="opc-totals__priority opc-totals__priority--return">
          <dt>Awaiting return from bending</dt>
          <dd>{formatWeightKg(awaitingBendReturnWeightKg)}</dd>
          <p>Sent out and not yet returned</p>
        </div>
        <div className="opc-totals__metric">
          <dt>Total Weight</dt>
          <dd>{formatWeightKg(totalWeightKg)}</dd>
        </div>
        <div className="opc-totals__metric">
          <dt>Cut Weight</dt>
          <dd>{formatWeightKg(cutWeightKg)}</dd>
        </div>
        <div className="opc-totals__metric">
          <dt>Out Bend Weight</dt>
          <dd>{formatWeightKg(outBendWeightKg)}</dd>
        </div>
        <div className="opc-totals__metric">
          <dt>Bended Weight</dt>
          <dd>{formatWeightKg(bendWeightKg)}</dd>
        </div>
      </dl>
      {weightsMissing ? (
        <p className="opc-totals__note">Some items have no unit weight — weights are partial.</p>
      ) : null}
    </DashboardCard>
  )
}
