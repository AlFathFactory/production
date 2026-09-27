import { ProductionActionBadge } from '../../production/components/ProductionActionBadge'
import { ProductionProgressBadge } from '../../production/components/ProductionProgressBadge'
import { ProductionRouteBadge } from '../../production/components/ProductionRouteBadge'
import { formatPercent, toFiniteNumber, toNullableNumber } from '../../production/utils'
import type { CurrentStatus, CurrentStatusRow } from '../types'
import { formatReportQuantity } from '../utils/reportSummary'

type OperationalColumn =
  | 'total_quantity'
  | 'cut_total'
  | 'remaining_cut'
  | 'out_bend_total'
  | 'waiting_issue_packing_qty'
  | 'bend_total'
  | 'waiting_receive_packing_qty'
  | 'rolling_total'
  | 'waiting_rolling_qty'
  | 'ready_to_dispense_qty'
  | 'dispensed_total'
  | 'remaining_to_dispense'

const allOperationalColumns: readonly OperationalColumn[] = [
  'total_quantity',
  'cut_total',
  'remaining_cut',
  'out_bend_total',
  'waiting_issue_packing_qty',
  'bend_total',
  'waiting_receive_packing_qty',
  'rolling_total',
  'waiting_rolling_qty',
  'ready_to_dispense_qty',
  'dispensed_total',
  'remaining_to_dispense',
]

const columnsByStatus: Record<CurrentStatus, readonly OperationalColumn[]> = {
  REMAINING_CUT: ['total_quantity', 'cut_total', 'remaining_cut'],
  WAITING_ISSUE_PACKING: ['total_quantity', 'out_bend_total', 'waiting_issue_packing_qty'],
  WAITING_RECEIVE_PACKING: ['total_quantity', 'bend_total', 'waiting_receive_packing_qty'],
  WAITING_ROLLING: ['total_quantity', 'rolling_total', 'waiting_rolling_qty'],
  READY_TO_DISPENSE: ['total_quantity', 'ready_to_dispense_qty', 'dispensed_total', 'remaining_to_dispense'],
  PARTIALLY_DISPENSED: ['total_quantity', 'ready_to_dispense_qty', 'dispensed_total', 'remaining_to_dispense'],
  COMPLETED: ['total_quantity', 'dispensed_total', 'remaining_to_dispense'],
  NOT_STARTED: ['total_quantity', 'cut_total', 'remaining_cut'],
}

function getVisibleColumns(statuses: CurrentStatus[]): Set<OperationalColumn> {
  if (statuses.length === 0) {
    return new Set(allOperationalColumns)
  }

  return new Set(statuses.flatMap((status) => columnsByStatus[status]))
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function pendingClass(value: number | string | null): string {
  return toFiniteNumber(value) > 0
    ? 'reports-table__number current-status-table__pending'
    : 'reports-table__number'
}

interface CurrentStatusTableProps {
  rows: CurrentStatusRow[]
  statuses: CurrentStatus[]
}

export function CurrentStatusTable({ rows, statuses }: CurrentStatusTableProps) {
  const visibleColumns = getVisibleColumns(statuses)
  const isVisible = (column: OperationalColumn) => visibleColumns.has(column)
  const showStatusDetails = statuses.length === 0

  return (
    <div className="reports-table-wrap" tabIndex={0} aria-label="Current production status report. Scroll horizontally to view all columns.">
      <table className="reports-table current-status-table">
        <thead>
          <tr>
            <th scope="col">Article</th>
            <th scope="col">Designation</th>
            <th scope="col">Profile</th>
            <th scope="col">Material</th>
            <th scope="col">Routing</th>
            {isVisible('total_quantity') ? <th scope="col" className="reports-table__number">Total Qty</th> : null}
            {isVisible('cut_total') ? <th scope="col" className="reports-table__number">CUT Total</th> : null}
            {isVisible('remaining_cut') ? <th scope="col" className="reports-table__number">Remaining CUT</th> : null}
            {isVisible('out_bend_total') ? <th scope="col" className="reports-table__number">Issue Packing Total</th> : null}
            {isVisible('waiting_issue_packing_qty') ? <th scope="col" className="reports-table__number">Waiting Issue Packing</th> : null}
            {isVisible('bend_total') ? <th scope="col" className="reports-table__number">Receive Packing Total</th> : null}
            {isVisible('waiting_receive_packing_qty') ? <th scope="col" className="reports-table__number">Waiting Receive Packing</th> : null}
            {isVisible('rolling_total') ? <th scope="col" className="reports-table__number">ROLLING Total</th> : null}
            {isVisible('waiting_rolling_qty') ? <th scope="col" className="reports-table__number">Waiting Rolling</th> : null}
            {isVisible('ready_to_dispense_qty') ? <th scope="col" className="reports-table__number">Ready to Dispense</th> : null}
            {isVisible('dispensed_total') ? <th scope="col" className="reports-table__number">Dispensed Total</th> : null}
            {isVisible('remaining_to_dispense') ? <th scope="col" className="reports-table__number">Remaining to Dispense</th> : null}
            {showStatusDetails ? <th scope="col">Next Action</th> : null}
            {showStatusDetails ? <th scope="col">Progress State</th> : null}
            {showStatusDetails ? <th scope="col" className="reports-table__number">Completion %</th> : null}
            {showStatusDetails ? <th scope="col">Last Activity</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.production_item_id ?? `${row.article}-${index}`}>
              <td>{row.article ?? '—'}</td>
              <td className="reports-table__designation">{row.designation ?? '—'}</td>
              <td>{row.profile ?? '—'}</td>
              <td>{row.material ?? '—'}</td>
              <td><ProductionRouteBadge route={row.routing} /></td>
              {isVisible('total_quantity') ? <td className="reports-table__number">{formatReportQuantity(row.total_quantity)}</td> : null}
              {isVisible('cut_total') ? <td className="reports-table__number">{formatReportQuantity(row.cut_total)}</td> : null}
              {isVisible('remaining_cut') ? <td className={pendingClass(row.remaining_cut)}>{formatReportQuantity(row.remaining_cut)}</td> : null}
              {isVisible('out_bend_total') ? <td className="reports-table__number">{formatReportQuantity(row.out_bend_total)}</td> : null}
              {isVisible('waiting_issue_packing_qty') ? <td className={pendingClass(row.waiting_issue_packing_qty)}>{formatReportQuantity(row.waiting_issue_packing_qty)}</td> : null}
              {isVisible('bend_total') ? <td className="reports-table__number">{formatReportQuantity(row.bend_total)}</td> : null}
              {isVisible('waiting_receive_packing_qty') ? <td className={pendingClass(row.waiting_receive_packing_qty)}>{formatReportQuantity(row.waiting_receive_packing_qty)}</td> : null}
              {isVisible('rolling_total') ? <td className="reports-table__number">{formatReportQuantity(row.rolling_total)}</td> : null}
              {isVisible('waiting_rolling_qty') ? <td className={pendingClass(row.waiting_rolling_qty)}>{formatReportQuantity(row.waiting_rolling_qty)}</td> : null}
              {isVisible('ready_to_dispense_qty') ? <td className={pendingClass(row.ready_to_dispense_qty)}>{formatReportQuantity(row.ready_to_dispense_qty)}</td> : null}
              {isVisible('dispensed_total') ? <td className="reports-table__number">{formatReportQuantity(row.dispensed_total)}</td> : null}
              {isVisible('remaining_to_dispense') ? <td className={pendingClass(row.remaining_to_dispense)}>{formatReportQuantity(row.remaining_to_dispense)}</td> : null}
              {showStatusDetails ? <td><ProductionActionBadge action={row.next_action} /></td> : null}
              {showStatusDetails ? <td><ProductionProgressBadge progressState={row.progress_state} /></td> : null}
              {showStatusDetails ? <td className="reports-table__number">{formatPercent(toNullableNumber(row.completion_percent))}</td> : null}
              {showStatusDetails ? <td>{formatDateTime(row.last_activity_at)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
