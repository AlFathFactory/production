import { Input } from '../../../components/ui/Input'
import { formatQuantity } from '../../production/utils'
import { getReturnQuantityError } from '../returnValidation'
import type { BendingReturnDraftItem } from '../types'

interface BendingReturnItemsTableProps {
  isDisabled: boolean
  items: BendingReturnDraftItem[]
  onQuantityChange: (dispatchItemId: string, quantity: number) => void
}

export function BendingReturnItemsTable({ isDisabled, items, onQuantityChange }: BendingReturnItemsTableProps) {
  return (
    <div className="bending-table-wrap" tabIndex={0} aria-label="Outstanding dispatch materials. Scroll horizontally to see all columns.">
      <table className="bending-table bending-table--return">
        <thead>
          <tr>
            <th scope="col">Article</th>
            <th scope="col">Designation</th>
            <th scope="col">Sent</th>
            <th scope="col">Returned</th>
            <th scope="col">Outstanding</th>
            <th scope="col">Return Qty</th>
            <th scope="col">Estimated Weight</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const quantityError = getReturnQuantityError(item.quantity, item.outstandingQuantity)
            const errorId = `bending-return-quantity-error-${item.dispatchItemId}`
            const estimatedWeight = item.unitWeightKg === null ? null : item.quantity * item.unitWeightKg

            return (
              <tr key={item.dispatchItemId}>
                <td><strong>{item.article}</strong></td>
                <td>{item.designation ?? '—'}</td>
                <td>{formatQuantity(item.sentQuantity)}</td>
                <td>{formatQuantity(item.previousReturnedQuantity)}</td>
                <td><strong>{formatQuantity(item.outstandingQuantity)}</strong></td>
                <td className="bending-table__quantity">
                  <Input
                    aria-describedby={quantityError ? errorId : undefined}
                    aria-label={`Return quantity for ${item.article}`}
                    disabled={isDisabled}
                    hasError={Boolean(quantityError)}
                    max={item.outstandingQuantity}
                    min="0"
                    step="any"
                    type="number"
                    value={item.quantity || ''}
                    onChange={(event) => onQuantityChange(item.dispatchItemId, event.target.valueAsNumber)}
                  />
                  {quantityError ? <span className="bending-quantity-error" id={errorId}>{quantityError}</span> : null}
                </td>
                <td>{estimatedWeight === null || !Number.isFinite(estimatedWeight) ? '—' : `${formatQuantity(estimatedWeight)} kg`}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
