import { formatQuantity } from '../../production/utils'
import type { BendingDestinationSummary as DestinationSummary } from '../types'

export function BendingDestinationSummary({ summary }: { summary: DestinationSummary }) {
  return (
    <dl className="bending-destination-summary" aria-label="Destination outstanding summary">
      <div><dt>Open Items</dt><dd>{summary.outstandingItemCount}</dd></div>
      <div><dt>Outstanding Quantity</dt><dd>{formatQuantity(summary.outstandingQuantity)}</dd></div>
      <div><dt>Outstanding Weight</dt><dd>{formatQuantity(summary.outstandingWeightKg)} kg</dd></div>
      <div><dt>Oldest Open Dispatch</dt><dd>{summary.oldestOpenDispatchDate ?? '—'}</dd></div>
    </dl>
  )
}
