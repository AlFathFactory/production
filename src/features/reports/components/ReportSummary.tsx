import { reportOperationLabels } from '../constants'
import type { ReportRow } from '../types'
import {
  computeReportSummary,
  formatReportCount,
  formatReportQuantity,
  formatReportWeightKg,
} from '../utils/reportSummary'

interface ReportSummaryProps {
  rows: ReportRow[]
  isFetching: boolean
}

export function ReportSummary({ rows, isFetching }: ReportSummaryProps) {
  const summary = computeReportSummary(rows)

  return (
    <>
      <section className="reports-summary" aria-label="Report summary" aria-busy={isFetching}>
        <div className="reports-section-heading">
          <h2>Summary</h2>
          {isFetching ? <span>Updating…</span> : null}
        </div>
        <dl className="reports-summary__grid">
          <div>
            <dt>Total Operations</dt>
            <dd>{formatReportCount(summary.operations)}</dd>
          </div>
          <div>
            <dt>Total Quantity</dt>
            <dd>{formatReportQuantity(summary.quantity)}</dd>
          </div>
          <div>
            <dt>Total Weight</dt>
            <dd>{formatReportWeightKg(summary.weightKg)}</dd>
          </div>
        </dl>
      </section>

      {summary.breakdown.length > 0 ? (
        <section className="reports-breakdown" aria-label="Operation breakdown" aria-busy={isFetching}>
          <div className="reports-section-heading">
            <h2>Operation Breakdown</h2>
          </div>
          <div className="reports-breakdown__grid">
            {summary.breakdown.map((item) => (
              <article key={item.operation} className="reports-breakdown__item">
                <h3>{reportOperationLabels[item.operation]}</h3>
                <dl>
                  <div><dt>Operations</dt><dd>{formatReportCount(item.operations)}</dd></div>
                  <div><dt>Qty</dt><dd>{formatReportQuantity(item.quantity)}</dd></div>
                  <div><dt>Weight</dt><dd>{formatReportWeightKg(item.weightKg)}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
