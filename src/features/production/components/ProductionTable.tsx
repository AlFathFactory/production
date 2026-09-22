import { useState } from 'react'

import { ProductionTableRow } from './ProductionTableRow'
import type { DirectStageAction, ProductionSearchRow } from '../types'

interface ProductionTableProps {
  items: ProductionSearchRow[]
  onStageAction: (item: ProductionSearchRow, action: DirectStageAction) => void
  onViewHistory: (item: ProductionSearchRow) => void
}

export function ProductionTable({ items, onStageAction, onViewHistory }: ProductionTableProps) {
  const [openRowKey, setOpenRowKey] = useState<string | null>(null)

  const selectStageAction = (item: ProductionSearchRow, action: DirectStageAction) => {
    setOpenRowKey(null)
    onStageAction(item, action)
  }

  const viewHistory = (item: ProductionSearchRow) => {
    setOpenRowKey(null)
    onViewHistory(item)
  }

  return (
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
        <tbody>{items.map((item, index) => {
          const rowKey = item.production_item_id ?? `production-row-${index}`
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
  )
}
