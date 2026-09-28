import { useEffect, useState } from 'react'

import { Button } from '../../../components/ui/Button'
import type { ActionQueueRow } from '../types'

const PAGE_SIZE = 25

interface ActionQueueTableProps {
  items: ActionQueueRow[]
}

export function ActionQueueTable({ items }: ActionQueueTableProps) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const visibleItems = items.slice(firstIndex, firstIndex + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [items])

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
              <th scope="col">Total Quantity</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item, index) => (
              <tr key={item.production_item_id ?? `action-queue-row-${firstIndex + index}`}>
                <td dir="auto"><strong>{item.article}</strong></td>
                <td dir="auto">{item.designation ?? '—'}</td>
                <td dir="auto">{item.profile ?? '—'}</td>
                <td><span className="dashboard-route-badge">{item.routing}</span></td>
                <td className="action-queue-table__number">{item.total_quantity ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav className="action-queue-pagination" aria-label="Action queue table pages">
        <span className="action-queue-pagination__count">
          Showing {firstIndex + 1}–{Math.min(firstIndex + PAGE_SIZE, items.length)} of {items.length} items
        </span>
        <div className="action-queue-pagination__controls">
          <Button type="button" variant="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
            Previous
          </Button>
          <span aria-live="polite">Page {currentPage} of {pageCount}</span>
          <Button type="button" variant="secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
            Next
          </Button>
        </div>
      </nav>
    </section>
  )
}
