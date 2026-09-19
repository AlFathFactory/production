import { Button } from '../../../components/ui/Button'
import type { ProductionSearchRow } from '../../production/types'
import { formatQuantity } from '../../production/utils'

interface BendingEligibleItemsTableProps {
  isDisabled: boolean
  items: ProductionSearchRow[]
  onAdd: (item: ProductionSearchRow) => void
  selectedItemIds: Set<string>
}

export function BendingEligibleItemsTable({ isDisabled, items, onAdd, selectedItemIds }: BendingEligibleItemsTableProps) {
  if (items.length === 0) {
    return <p className="bending-empty">No BEND materials are currently available to send for bending.</p>
  }

  return (
    <div className="bending-table-wrap" tabIndex={0} aria-label="Eligible BEND materials. Scroll horizontally to see all columns.">
      <table className="bending-table">
        <thead>
          <tr>
            <th scope="col">Article</th>
            <th scope="col">Designation</th>
            <th scope="col">Profile</th>
            <th scope="col">CUT</th>
            <th scope="col">Already Out Bend</th>
            <th scope="col">Available to Send</th>
            <th scope="col">Unit Weight</th>
            <th scope="col"><span className="sr-only">Add material</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const id = item.production_item_id ?? ''
            const isSelected = selectedItemIds.has(id)
            return (
              <tr key={id}>
                <td><strong>{item.article ?? '—'}</strong></td>
                <td>{item.designation ?? '—'}</td>
                <td>{item.profile ?? '—'}</td>
                <td>{formatQuantity(item.cut_total)}</td>
                <td>{formatQuantity(item.out_bend_total)}</td>
                <td><strong>{formatQuantity(item.remaining_out_bend)}</strong></td>
                <td>{item.unit_weight_kg == null ? '—' : `${formatQuantity(item.unit_weight_kg)} kg`}</td>
                <td>
                  <Button
                    aria-label={`${isSelected ? 'Selected' : 'Add'} ${item.article ?? 'material'} to dispatch`}
                    className="bending-table__action"
                    disabled={isDisabled || isSelected}
                    type="button"
                    variant="secondary"
                    onClick={() => onAdd(item)}
                  >
                    {isSelected ? 'Selected' : 'Add'}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
