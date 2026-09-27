import type { LotDashboardItem } from '../types'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function renderProgressBar(percent: number) {
  return (
    <div className="dashboard-progress">
      <div className="dashboard-progress__bar">
        <span className="dashboard-progress__fill" style={{ width: `${Math.min(100, Math.max(0, Math.round(percent)))}%` }} />
      </div>
      <span className="dashboard-progress__label">{Math.round(percent)}%</span>
    </div>
  )
}

interface LotDashboardTableProps {
  lots: LotDashboardItem[]
}

export function LotDashboardTable({ lots }: LotDashboardTableProps) {
  if (lots.length === 0) return null

  return (
    <section className="dashboard-results" aria-label="Lot dashboard results">
      <div className="dashboard-table-wrap" tabIndex={0} aria-label="Lot dashboard table. Scroll horizontally to view all columns.">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th scope="col">Lot</th>
              <th scope="col">Project / Number</th>
              <th scope="col">Items</th>
              <th scope="col">Completed</th>
              <th scope="col">In Progress</th>
              <th scope="col">Not Started</th>
              <th scope="col">Completion</th>
              <th scope="col">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => (
              <tr key={lot.lotId}>
                <td dir="auto"><strong>{lot.lotNumber}</strong></td>
                <td>
                  <div>{lot.projectName ?? '—'}</div>
                  <small>{lot.projectNumber ?? '—'}</small>
                </td>
                <td className="dashboard-table__number">{lot.totalItems}</td>
                <td className="dashboard-table__number">{lot.completedItems}</td>
                <td className="dashboard-table__number">{lot.inProgressItems}</td>
                <td className="dashboard-table__number">{lot.notStartedItems}</td>
                <td>{renderProgressBar(lot.completionPercent)}</td>
                <td>{formatDate(lot.lastActivityAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
