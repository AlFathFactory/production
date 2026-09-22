import { useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { ProductionTableRow } from './ProductionTableRow'
import type { DirectStageAction, ProductionSearchRow } from '../types'

const PAGE_SIZE = 25

interface ProductionTableProps {
  items: ProductionSearchRow[]
  onStageAction: (item: ProductionSearchRow, action: DirectStageAction) => void
  onViewHistory: (item: ProductionSearchRow) => void
}

export function ProductionTable({ items, onStageAction, onViewHistory }: ProductionTableProps) {
  const [openRowKey, setOpenRowKey] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const visibleItems = items.slice(firstIndex, firstIndex + PAGE_SIZE)

  const changePage = (nextPage: number) => {
    setOpenRowKey(null)
    setPage(nextPage)
  }

  const selectStageAction = (item: ProductionSearchRow, action: DirectStageAction) => {
    setOpenRowKey(null)
    onStageAction(item, action)
  }

  const viewHistory = (item: ProductionSearchRow) => {
    setOpenRowKey(null)
    onViewHistory(item)
  }

  return (
    <>
      <div className="production-table-wrap" tabIndex={0} aria-label="Production items table. Scroll horizontally to view all columns.">
        <table className="production-table">
          <thead>
            <tr>
              <th scope="col">Article</th>
              <th scope="col">Designation</th>
              <th scope="col">Profile</th>
              <th scope="col">Route</th>
              <th scope="col">T.QTY</th>
              <th scope="col">CUT</th>
              <th scope="col">OUT BEND</th>
              <th scope="col">BEND / ROLLING</th>
              <th scope="col">Warehouse</th>
              <th scope="col">Dispensed</th>
              <th scope="col">Next Action</th>
              <th scope="col">Progress</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>{visibleItems.map((item, index) => {
            const rowKey = item.production_item_id ?? `production-row-${firstIndex + index}`
            return (
              <ProductionTableRow
                key={rowKey}
                item={item}
                isActionOpen={openRowKey === rowKey}
                onToggleAction={() => setOpenRowKey((current) => current === rowKey ? null : rowKey)}
                onStageAction={selectStageAction}
                onViewHistory={viewHistory}
              />
            )
          })}</tbody>
        </table>
      </div>
      <nav className="production-pagination" aria-label="Production table pages">
        <span className="production-pagination__count">
          Showing {firstIndex + 1}–{Math.min(firstIndex + PAGE_SIZE, items.length)} of {items.length} items
        </span>
        <div className="production-pagination__controls">
          <Button type="button" variant="secondary" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>
            Previous
          </Button>
          <span aria-live="polite">Page {currentPage} of {pageCount}</span>
          <Button type="button" variant="secondary" disabled={currentPage === pageCount} onClick={() => changePage(currentPage + 1)}>
            Next
          </Button>
        </div>
      </nav>
    </>
  )
}
