import { ProductionRouteBadge } from './ProductionRouteBadge'
import { ProductionRowActions } from './ProductionRowActions'
import { getAvailableDirectStageActions } from '../productionActions'
import type { DirectStageAction, ProductionSearchRow } from '../types'
import { formatQuantity } from '../utils'

function stageValue(value: number | null, applicable: boolean): string {
  return applicable ? formatQuantity(value) : '—'
}

interface ProductionTableRowProps {
  isSelectedForDispense: boolean
  item: ProductionSearchRow
  onStageAction: (item: ProductionSearchRow, action: DirectStageAction) => void
  onToggleDispenseItem: (productionItemId: string, selected: boolean) => void
  onViewHistory: (item: ProductionSearchRow) => void
}

export function ProductionTableRow({ isSelectedForDispense, item, onStageAction, onToggleDispenseItem, onViewHistory }: ProductionTableRowProps) {
  const supportsOutBend = item.routing === 'BEND'
  const supportsBendOrRolling = item.routing === 'BEND' || item.routing === 'ROLLING'
  const finalStage = item.routing === 'BEND' ? item.bend_total : item.routing === 'ROLLING' ? item.rolling_total : null
  const canSelectForDispense = getAvailableDirectStageActions(item).some((action) => action.stage === 'DISPENSE')

  return (
    <tr>
      <td className="production-table__select">
        <input
          aria-label={`Select Article ${item.article ?? 'item'} for DISPENSE`}
          checked={isSelectedForDispense}
          disabled={!canSelectForDispense || !item.production_item_id}
          type="checkbox"
          onChange={(event) => {
            if (item.production_item_id) onToggleDispenseItem(item.production_item_id, event.target.checked)
          }}
        />
      </td>
      <td dir="auto">{item.article ?? '—'}</td>
      <td className="production-table__designation" dir="auto">{item.designation ?? '—'}</td>
      <td dir="auto">{item.profile ?? '—'}</td>
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
