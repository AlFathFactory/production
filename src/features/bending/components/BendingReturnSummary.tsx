import { formatQuantity } from '../../production/utils'
import { calculateReturnSummary } from '../returnValidation'
import type { BendingReturnDraftItem } from '../types'

export function BendingReturnSummary({ items }: { items: BendingReturnDraftItem[] }) {
  const summary = calculateReturnSummary(items)
  const hasIncompleteWeight = summary.selectedLines > summary.itemsWithWeight

  return (
    <div>
      <dl className="bending-summary" aria-label="Return summary">
        <div><dt>Selected lines</dt><dd>{summary.selectedLines}</dd></div>
        <div><dt>Total return quantity</dt><dd>{formatQuantity(summary.totalQuantity)}</dd></div>
        <div>
          <dt>Estimated total weight</dt>
          <dd>{summary.itemsWithWeight === 0 ? '—' : `${formatQuantity(summary.estimatedWeightKg)} kg${hasIncompleteWeight ? ' *' : ''}`}</dd>
        </div>
      </dl>
      {hasIncompleteWeight && summary.itemsWithWeight > 0 ? <p className="bending-summary__note">* Excludes lines without a unit weight.</p> : null}
    </div>
  )
}
