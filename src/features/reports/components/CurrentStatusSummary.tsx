import { formatReportCount, formatReportQuantity, formatReportWeightKg } from '../utils/reportSummary'
import type { CurrentStatusMetric, CurrentStatusSummaryData } from '../utils/currentStatusSummary'

interface CurrentStatusSummaryProps {
  isFetching: boolean
  summary: CurrentStatusSummaryData
}

const stageMetrics: Array<{
  key: keyof Pick<
    CurrentStatusSummaryData,
    | 'remainingCut'
    | 'waitingIssuePacking'
    | 'waitingReceivePacking'
    | 'waitingRolling'
    | 'readyToDispense'
    | 'remainingToDispense'
  >
  label: string
}> = [
  { key: 'remainingCut', label: 'Remaining to Cut' },
  { key: 'waitingIssuePacking', label: 'Waiting Issue Packing' },
  { key: 'waitingReceivePacking', label: 'Waiting Receive Packing' },
  { key: 'waitingRolling', label: 'Waiting Rolling' },
  { key: 'readyToDispense', label: 'Ready to Dispense' },
  { key: 'remainingToDispense', label: 'Remaining to Dispense' },
]

function StageMetric({ label, metric }: { label: string; metric: CurrentStatusMetric }) {
  return (
    <div className="current-status-summary__stage">
      <dt>{label}</dt>
      <dd>{formatReportQuantity(metric.quantity)}</dd>
      <span>Qty</span>
      <p>{formatReportWeightKg(metric.weightKg)}</p>
    </div>
  )
}

export function CurrentStatusSummary({ isFetching, summary }: CurrentStatusSummaryProps) {
  return (
    <section className="reports-summary" aria-label="Current status summary" aria-busy={isFetching}>
      <div className="reports-section-heading">
        <h2>Summary</h2>
        {isFetching ? <span>Updating…</span> : null}
      </div>
      <dl className="current-status-summary__grid">
        <div className="current-status-summary__total">
          <dt>Total Items</dt>
          <dd>{formatReportCount(summary.items)}</dd>
        </div>
        <div className="current-status-summary__total">
          <dt>Total Quantity</dt>
          <dd>{formatReportQuantity(summary.totalQuantity)}</dd>
        </div>
        {stageMetrics.map(({ key, label }) => (
          <StageMetric key={key} label={label} metric={summary[key]} />
        ))}
      </dl>
    </section>
  )
}
