import { ProductionRouteBadge } from '../../production/components/ProductionRouteBadge'
import { reportOperationLabels } from '../constants'
import type { ReportRow } from '../types'
import { formatReportDate, formatReportQuantity, formatReportWeight } from '../utils/reportSummary'

export function ReportsTable({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="reports-table-wrap" tabIndex={0} aria-label="Production operations report. Scroll horizontally to view all columns.">
      <table className="reports-table">
        <thead>
          <tr>
            <th scope="col">Operation Date</th>
            <th scope="col">Article</th>
            <th scope="col">Designation</th>
            <th scope="col">Profile</th>
            <th scope="col">Routing</th>
            <th scope="col">Operation</th>
            <th scope="col" className="reports-table__number">Total Qty</th>
            <th scope="col" className="reports-table__number">Qty</th>
            <th scope="col" className="reports-table__number">Unit Wt. kg</th>
            <th scope="col" className="reports-table__number">Operation Wt. kg</th>
            <th scope="col">Performed By</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.operation_id ?? `${row.operation_date}-${row.article}-${index}`}>
              <td>{formatReportDate(row.operation_date)}</td>
              <td dir="auto">{row.article ?? '—'}</td>
              <td className="reports-table__designation" dir="auto">{row.designation ?? '—'}</td>
              <td dir="auto">{row.profile ?? '—'}</td>
              <td><ProductionRouteBadge route={row.routing} /></td>
              <td><span className="reports-operation-badge">{reportOperationLabels[row.operation]}</span></td>
              <td className="reports-table__number">{formatReportQuantity(row.article_total_quantity)}</td>
              <td className="reports-table__number">{formatReportQuantity(row.quantity)}</td>
              <td className="reports-table__number">{formatReportWeight(row.unit_weight_kg)}</td>
              <td className="reports-table__number">{formatReportWeight(row.operation_weight_kg)}</td>
              <td dir="auto">{row.performed_by_name ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
