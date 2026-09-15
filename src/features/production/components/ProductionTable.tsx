import { ProductionTableRow } from './ProductionTableRow'
import type { DirectStageAction, ProductionSearchRow } from '../types'

interface ProductionTableProps {
  items: ProductionSearchRow[]
  onStageAction: (item: ProductionSearchRow, action: DirectStageAction) => void
}

export function ProductionTable({ items, onStageAction }: ProductionTableProps) {
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
        <tbody>{items.map((item, index) => <ProductionTableRow key={item.production_item_id ?? `production-row-${index}`} item={item} onStageAction={onStageAction} />)}</tbody>
      </table>
    </div>
  )
}
