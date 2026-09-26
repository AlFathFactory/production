import { ProductionRouteBadge } from '../../production/components/ProductionRouteBadge'
import { formatQuantity, toNullableNumber } from '../../production/utils'
import { reportOperationLabels } from '../constants'
import type { ReportRow } from '../types'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function formatWeight(value: number | string | null): string {
  const numeric = toNullableNumber(value)
  return numeric === null
    ? '—'
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(numeric)
}

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
            <th scope="col" className="reports-table__number">Qty</th>
            <th scope="col" className="reports-table__number">Unit Wt. kg</th>
            <th scope="col" className="reports-table__number">Operation Wt. kg</th>
            <th scope="col">Performed By</th>
            <th scope="col">Reference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.operation_id ?? `${row.operation_date}-${row.article}-${index}`}>
              <td>{formatDate(row.operation_date)}</td>
              <td>{row.article ?? '—'}</td>
              <td className="reports-table__designation">{row.designation ?? '—'}</td>
              <td>{row.profile ?? '—'}</td>
              <td><ProductionRouteBadge route={row.routing} /></td>
              <td><span className="reports-operation-badge">{reportOperationLabels[row.operation]}</span></td>
              <td className="reports-table__number">{formatQuantity(row.quantity)}</td>
              <td className="reports-table__number">{formatWeight(row.unit_weight_kg)}</td>
              <td className="reports-table__number">{formatWeight(row.operation_weight_kg)}</td>
              <td>{row.performed_by_name ?? '—'}</td>
              <td>{row.reference ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
