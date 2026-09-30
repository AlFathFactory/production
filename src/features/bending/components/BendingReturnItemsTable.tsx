import { Input } from '../../../components/ui/Input'
import { formatQuantity } from '../../production/utils'
import { getReturnQuantityError } from '../returnValidation'
import type { BendingReturnDraftItem } from '../types'

interface BendingReturnItemsTableProps {
  isDisabled: boolean
  items: BendingReturnDraftItem[]
  onQuantityChange: (dispatchItemId: string, quantity: number) => void
  onToggle: (dispatchItemId: string) => void
}

export function BendingReturnItemsTable({ isDisabled, items, onQuantityChange, onToggle }: BendingReturnItemsTableProps) {
  const selectedDispatchId = items.find((item) => item.isSelected)?.dispatchId ?? null

  return (
    <div className="bending-table-wrap" tabIndex={0} aria-label="Outstanding issued materials. Scroll horizontally to see all columns.">
      <table className="bending-table bending-table--destination-inventory">
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">Select</span></th>
            <th scope="col">Dispatch Number</th>
            <th scope="col">Dispatch Date</th>
            <th scope="col">Destination</th>
            <th scope="col">Project</th>
            <th scope="col">Project Number</th>
            <th scope="col">Lot</th>
            <th scope="col">Article</th>
            <th scope="col">Designation</th>
            <th scope="col">Profile</th>
            <th scope="col">Material</th>
            <th scope="col">Routing</th>
            <th scope="col">Issued Quantity</th>
            <th scope="col">Returned Quantity</th>
            <th scope="col">Outstanding Quantity</th>
            <th scope="col">Unit Weight</th>
            <th scope="col">Outstanding Weight</th>
            <th scope="col">Return Status</th>
            <th scope="col">Last Return Date</th>
            <th scope="col">Return Qty</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const quantityError = item.isSelected
              ? (item.quantity > 0 ? getReturnQuantityError(item.quantity, item.outstandingQuantity) : 'Enter a quantity greater than zero.')
              : null
            const errorId = `bending-return-quantity-error-${item.dispatchItemId}`
            const isOtherDispatch = Boolean(selectedDispatchId && selectedDispatchId !== item.dispatchId)

            return (
              <tr key={item.dispatchItemId}>
                <td>
                  <input
                    aria-label={`Select ${item.article} from dispatch ${item.dispatchNumber}`}
                    checked={item.isSelected}
                    disabled={isDisabled || isOtherDispatch}
                    type="checkbox"
                    onChange={() => onToggle(item.dispatchItemId)}
                  />
                </td>
                <td><strong>{item.dispatchNumber}</strong></td>
                <td>{item.dispatchDate}</td>
                <td dir="auto">{item.destinationName}</td>
                <td dir="auto">{item.projectName}</td>
                <td dir="auto">{item.projectNumber}</td>
                <td dir="auto">{item.lotNumber}</td>
                <td dir="auto"><strong>{item.article}</strong></td>
                <td dir="auto">{item.designation ?? '—'}</td>
                <td dir="auto">{item.profile ?? '—'}</td>
                <td dir="auto">{item.material ?? '—'}</td>
                <td>{item.routing ?? '—'}</td>
                <td>{formatQuantity(item.issuedQuantity)}</td>
                <td>{formatQuantity(item.returnedQuantity)}</td>
                <td><strong>{formatQuantity(item.outstandingQuantity)}</strong></td>
                <td>{item.unitWeightKg === null ? '—' : `${formatQuantity(item.unitWeightKg)} kg`}</td>
                <td>{formatQuantity(item.outstandingWeightKg)} kg</td>
                <td>{item.returnStatus}</td>
                <td>{item.lastReturnDate ?? '—'}</td>
                <td className="bending-table__quantity">
                  <Input
                    aria-describedby={quantityError ? errorId : undefined}
                    aria-label={`Return quantity for ${item.article}`}
                    disabled={isDisabled || !item.isSelected}
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
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
