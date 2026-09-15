import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { getDispatchQuantityError } from '../dispatchValidation'
import type { BendingDispatchDraftItem } from '../types'
import { formatQuantity } from '../../production/utils'

interface BendingDispatchItemsTableProps {
  isDisabled: boolean
  items: BendingDispatchDraftItem[]
  onQuantityChange: (productionItemId: string, quantity: number) => void
  onRemove: (productionItemId: string) => void
}

export function BendingDispatchItemsTable({ isDisabled, items, onQuantityChange, onRemove }: BendingDispatchItemsTableProps) {
  if (items.length === 0) {
    return <p className="bending-empty">Add at least one eligible material to this dispatch.</p>
  }

  return (
    <div className="bending-table-wrap" tabIndex={0} aria-label="Selected dispatch items. Scroll horizontally to see all columns.">
      <table className="bending-table bending-table--draft">
        <thead>
          <tr>
            <th scope="col">Article</th>
            <th scope="col">Designation</th>
            <th scope="col">Profile</th>
            <th scope="col">Available</th>
            <th scope="col">Dispatch Qty</th>
            <th scope="col">Estimated Weight</th>
            <th scope="col"><span className="sr-only">Remove material</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const quantityError = getDispatchQuantityError(item.quantity, item.availableQuantity)
            const errorId = `bending-quantity-error-${item.productionItemId}`
            const estimatedWeight = item.unitWeightKg === null ? null : item.quantity * item.unitWeightKg

            return (
              <tr key={item.productionItemId}>
                <td><strong>{item.article}</strong></td>
                <td>{item.designation ?? '—'}</td>
                <td>{item.profile ?? '—'}</td>
                <td>{formatQuantity(item.availableQuantity)}</td>
                <td className="bending-table__quantity">
                  <Input
                    aria-describedby={quantityError ? errorId : undefined}
                    aria-label={`Dispatch quantity for ${item.article}`}
                    disabled={isDisabled}
                    hasError={Boolean(quantityError)}
                    max={item.availableQuantity}
                    min="0"
                    step="any"
                    type="number"
                    value={item.quantity || ''}
                    onChange={(event) => onQuantityChange(item.productionItemId, event.target.valueAsNumber)}
                  />
                  {quantityError ? <span className="bending-quantity-error" id={errorId}>{quantityError}</span> : null}
                </td>
                <td>{estimatedWeight === null || !Number.isFinite(estimatedWeight) ? '—' : `${formatQuantity(estimatedWeight)} kg`}</td>
                <td>
                  <Button
                    aria-label={`Remove ${item.article} from dispatch`}
                    className="bending-table__action"
                    disabled={isDisabled}
                    type="button"
                    variant="secondary"
                    onClick={() => onRemove(item.productionItemId)}
                  >
                    Remove
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
