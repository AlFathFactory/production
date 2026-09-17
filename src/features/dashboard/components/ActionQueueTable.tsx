import type { ActionQueueRow } from '../types'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

interface ActionQueueTableProps {
  items: ActionQueueRow[]
}

export function ActionQueueTable({ items }: ActionQueueTableProps) {
  if (items.length === 0) return null

  return (
    <section className="action-queue-results" aria-label="Action queue results">
      <div className="action-queue-table-wrap" tabIndex={0} aria-label="Action queue table. Scroll horizontally to view all columns.">
        <table className="action-queue-table">
          <thead>
            <tr>
              <th scope="col">Article</th>
              <th scope="col">Designation</th>
              <th scope="col">Profile</th>
              <th scope="col">Route</th>
              <th scope="col">Next Action</th>
              <th scope="col">Available Qty</th>
              <th scope="col">Project / Number / Lot</th>
              <th scope="col">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.production_item_id ?? `action-queue-row-${index}`}>
                <td><strong>{item.article}</strong></td>
                <td>{item.designation ?? '—'}</td>
                <td>{item.profile ?? '—'}</td>
                <td><span className="dashboard-route-badge">{item.routing}</span></td>
                <td><span className="dashboard-action-badge">{item.next_action}</span></td>
                <td className="action-queue-table__number">{item.available_action_quantity}</td>
                <td>
                  <div>{item.project_name ?? '—'}</div>
                  <small>{item.project_number ?? '—'} / {item.lot_number ?? '—'}</small>
                </td>
                <td>{formatDate(item.last_activity_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}