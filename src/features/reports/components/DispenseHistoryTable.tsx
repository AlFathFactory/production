import { ProductionRouteBadge } from '../../production/components/ProductionRouteBadge'
import type { DispenseHistoryRow } from '../../dispense/types'
import { useReportPagination } from '../hooks/useReportPagination'
import { formatReportDate, formatReportQuantity, formatReportWeight } from '../utils/reportSummary'
import { ReportsPagination } from './ReportsPagination'

export function DispenseHistoryTable({ rows }: { rows: DispenseHistoryRow[] }) {
  const { currentPage, firstIndex, pageCount, setPage, visibleRows } = useReportPagination(rows)

  return (
    <>
      <div className="reports-table-wrap" tabIndex={0} aria-label="DISPENSE history. Scroll horizontally to view all columns.">
        <table className="reports-table dispense-history-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Person</th>
            <th scope="col">Project</th>
            <th scope="col">Project Number</th>
            <th scope="col">Lot</th>
            <th scope="col">Article</th>
            <th scope="col">Designation</th>
            <th scope="col">Profile</th>
            <th scope="col">Material</th>
            <th scope="col">Routing</th>
            <th scope="col" className="reports-table__number">Quantity</th>
            <th scope="col" className="reports-table__number">Unit Weight</th>
            <th scope="col" className="reports-table__number">Dispensed Weight</th>
            <th scope="col">Dispensed By</th>
            <th scope="col">Note</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, index) => (
            <tr key={row.stage_entry_id ?? `${row.dispense_date}-${row.article}-${firstIndex + index}`}>
              <td>{formatReportDate(row.dispense_date)}</td>
              <td dir="auto">{row.dispensed_to_name?.trim() || 'Not recorded'}</td>
              <td dir="auto">{row.project_name ?? '—'}</td>
              <td dir="auto">{row.project_number ?? '—'}</td>
              <td dir="auto">{row.lot_number ?? '—'}</td>
              <td dir="auto">{row.article ?? '—'}</td>
              <td className="reports-table__designation" dir="auto">{row.designation ?? '—'}</td>
              <td dir="auto">{row.profile ?? '—'}</td>
              <td dir="auto">{row.material ?? '—'}</td>
              <td><ProductionRouteBadge route={row.routing} /></td>
              <td className="reports-table__number">{formatReportQuantity(row.quantity)}</td>
              <td className="reports-table__number">{formatReportWeight(row.unit_weight_kg)}</td>
              <td className="reports-table__number">{formatReportWeight(row.dispense_weight_kg)}</td>
              <td dir="auto">{row.performed_by_name ?? '—'}</td>
              <td dir="auto">{row.note ?? '—'}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      <ReportsPagination
        currentPage={currentPage}
        firstIndex={firstIndex}
        itemLabel={rows.length === 1 ? 'item' : 'items'}
        pageCount={pageCount}
        totalItems={rows.length}
        onPageChange={setPage}
      />
    </>
  )
}
