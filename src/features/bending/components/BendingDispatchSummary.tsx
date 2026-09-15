import { calculateDispatchSummary } from '../dispatchValidation'
import type { BendingDispatchDraftItem } from '../types'
import { formatQuantity } from '../../production/utils'

export function BendingDispatchSummary({ items }: { items: BendingDispatchDraftItem[] }) {
  const summary = calculateDispatchSummary(items)
  const hasIncompleteWeight = summary.itemsWithWeight < items.length

  return (
    <div>
      <dl className="bending-summary" aria-label="Dispatch summary">
        <div><dt>Selected items</dt><dd>{items.length}</dd></div>
        <div><dt>Total quantity</dt><dd>{formatQuantity(summary.totalQuantity)}</dd></div>
        <div>
          <dt>Estimated total weight</dt>
          <dd>{summary.itemsWithWeight === 0 ? '—' : `${formatQuantity(summary.estimatedWeightKg)} kg${hasIncompleteWeight ? ' *' : ''}`}</dd>
        </div>
      </dl>
      {hasIncompleteWeight && summary.itemsWithWeight > 0 ? <p className="bending-summary__note">* Excludes lines without a unit weight.</p> : null}
    </div>
  )
}
