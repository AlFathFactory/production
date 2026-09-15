import { ProductionActionBadge } from './ProductionActionBadge'
import { ProductionProgressBadge } from './ProductionProgressBadge'
import { ProductionRouteBadge } from './ProductionRouteBadge'
import type { ProductionSearchRow } from '../types'
import { formatPercent, formatQuantity } from '../utils'

function stageValue(value: number | null, applicable: boolean): string {
  return applicable ? formatQuantity(value) : '—'
}

export function ProductionTableRow({ item }: { item: ProductionSearchRow }) {
  const supportsOutBend = item.routing === 'BEND'
  const supportsBendOrRolling = item.routing === 'BEND' || item.routing === 'ROLLING'
  const finalStage = item.routing === 'BEND' ? item.bend_total : item.routing === 'ROLLING' ? item.rolling_total : null
  const progressWidth = Math.min(100, Math.max(0, item.completion_percent ?? 0))

  return (
    <tr>
      <td>{item.article ?? '—'}</td>
      <td className="production-table__designation">{item.designation ?? '—'}</td>
      <td>{item.profile ?? '—'}</td>
      <td><ProductionRouteBadge route={item.routing} /></td>
      <td className="production-table__number">{formatQuantity(item.total_quantity)}</td>
      <td className="production-table__number">{formatQuantity(item.cut_total)}</td>
      <td className="production-table__number">{stageValue(item.out_bend_total, supportsOutBend)}</td>
      <td className="production-table__number">{stageValue(finalStage, supportsBendOrRolling)}</td>
      <td className="production-table__number">{formatQuantity(item.warehouse_stock)}</td>
      <td className="production-table__number">{formatQuantity(item.dispensed_total)}</td>
      <td><ProductionActionBadge action={item.next_action} /></td>
      <td>
        <div className="production-progress">
          <span aria-hidden="true"><span style={{ width: `${progressWidth}%` }} /></span>
          <strong>{formatPercent(item.completion_percent)}</strong>
          <ProductionProgressBadge progressState={item.progress_state} />
        </div>
      </td>
    </tr>
  )
}
