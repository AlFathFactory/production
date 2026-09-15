import { getAvailableDirectStageActions } from '../productionActions'
import type { DirectStageAction, ProductionSearchRow } from '../types'

interface ProductionRowActionsProps {
  item: ProductionSearchRow
  onSelectAction: (item: ProductionSearchRow, action: DirectStageAction) => void
}

export function ProductionRowActions({ item, onSelectAction }: ProductionRowActionsProps) {
  const actions = getAvailableDirectStageActions(item)
  const isComplete = item.next_action === 'COMPLETE' || (item.completion_percent ?? 0) >= 100

  if (isComplete) {
    return <span className="production-row-actions__complete">Complete</span>
  }

  if (actions.length === 0) {
    return <span className="production-row-actions__empty">No direct action</span>
  }

  return (
    <details className="production-row-actions">
      <summary>Add Progress</summary>
      <div className="production-row-actions__menu">
        {actions.map((action) => (
          <button key={action.stage} type="button" onClick={() => onSelectAction(item, action)}>{action.stage}</button>
        ))}
      </div>
    </details>
  )
}
