import { getAvailableDirectStageActions } from '../productionActions'
import type { DirectStageAction, ProductionSearchRow } from '../types'
import { formatQuantity } from '../utils'

interface ProductionRowActionsProps {
  item: ProductionSearchRow
  onSelectAction: (item: ProductionSearchRow, action: DirectStageAction) => void
  onViewHistory: (item: ProductionSearchRow) => void
}

const stageLabels: Record<DirectStageAction['stage'], string> = {
  CUT: 'Cut',
  ROLLING: 'Rolling',
  DISPENSE: 'Dispense',
}

export function ProductionRowActions({ item, onSelectAction, onViewHistory }: ProductionRowActionsProps) {
  const actions = getAvailableDirectStageActions(item)
  const isComplete = item.next_action === 'COMPLETE' || (item.completion_percent ?? 0) >= 100

  return (
    <div className="production-row-actions">
      {isComplete ? <span className="production-row-actions__complete">Complete</span> : null}
      {!isComplete && actions.length === 0 ? <span className="production-row-actions__empty">No action available</span> : null}
      {actions.map((action) => {
        const label = stageLabels[action.stage]
        const available = formatQuantity(action.availableQuantity)

        return (
          <button
            key={action.stage}
            type="button"
            className={`production-row-actions__stage production-row-actions__stage--${action.stage.toLowerCase()}`}
            title={`${label}: ${available} available for Article ${item.article ?? ''}`.trim()}
            aria-label={`Add ${label} progress for Article ${item.article ?? 'item'}; ${available} available`}
            onClick={() => onSelectAction(item, action)}
          >
            <span>{label}</span>
            <small>{available} available</small>
          </button>
        )
      })}
      <button
        type="button"
        className="production-row-actions__history"
        aria-label={`View history for Article ${item.article ?? 'item'}`}
        onClick={() => onViewHistory(item)}
      >
        History
      </button>
    </div>
  )
}
