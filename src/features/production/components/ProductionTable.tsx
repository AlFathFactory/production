import { ProductionTableRow } from './ProductionTableRow'
import type { ProductionSearchRow } from '../types'

export function ProductionTable({ items }: { items: ProductionSearchRow[] }) {
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
          </tr>
        </thead>
        <tbody>{items.map((item, index) => <ProductionTableRow key={item.production_item_id ?? `production-row-${index}`} item={item} />)}</tbody>
      </table>
    </div>
  )
}
