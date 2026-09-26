import { ProductionRouteBadge } from './ProductionRouteBadge'
import { ProductionRowActions } from './ProductionRowActions'
import type { DirectStageAction, ProductionSearchRow } from '../types'
import { formatQuantity } from '../utils'

function stageValue(value: number | null, applicable: boolean): string {
  return applicable ? formatQuantity(value) : '—'
}

interface ProductionTableRowProps {
  item: ProductionSearchRow
  onStageAction: (item: ProductionSearchRow, action: DirectStageAction) => void
  onViewHistory: (item: ProductionSearchRow) => void
}

export function ProductionTableRow({ item, onStageAction, onViewHistory }: ProductionTableRowProps) {
  const supportsOutBend = item.routing === 'BEND'
  const supportsBendOrRolling = item.routing === 'BEND' || item.routing === 'ROLLING'
  const finalStage = item.routing === 'BEND' ? item.bend_total : item.routing === 'ROLLING' ? item.rolling_total : null

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
      <td className="production-table__actions"><ProductionRowActions item={item} onSelectAction={onStageAction} onViewHistory={onViewHistory} /></td>
    </tr>
  )
}
