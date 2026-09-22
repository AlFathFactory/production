import { getAvailableDirectStageActions } from '../productionActions'
import type { DirectStageAction, ProductionSearchRow } from '../types'

interface ProductionRowActionsProps {
  item: ProductionSearchRow
  isOpen: boolean
  onToggle: () => void
  onSelectAction: (item: ProductionSearchRow, action: DirectStageAction) => void
  onViewHistory: (item: ProductionSearchRow) => void
}

export function ProductionRowActions({ item, isOpen, onToggle, onSelectAction, onViewHistory }: ProductionRowActionsProps) {
  const actions = getAvailableDirectStageActions(item)
  const isComplete = item.next_action === 'COMPLETE' || (item.completion_percent ?? 0) >= 100

  if (isComplete) {
    return (
      <>
        <span className="production-row-actions__complete">Complete</span>
        <button type="button" className="production-row-actions__history" onClick={() => onViewHistory(item)}>History</button>
      </>
    )
  }

  if (actions.length === 0) {
    return (
      <>
        <span className="production-row-actions__empty">No direct action</span>
        <button type="button" className="production-row-actions__history" onClick={() => onViewHistory(item)}>History</button>
      </>
    )
  }

  return (
    <details className="production-row-actions" open={isOpen}>
      <summary onClick={(event) => { event.preventDefault(); onToggle() }}>Add Progress</summary>
      <div className="production-row-actions__menu">
        {actions.map((action) => (
          <button key={action.stage} type="button" onClick={() => onSelectAction(item, action)}>{action.stage}</button>
        ))}
        <button type="button" className="production-row-actions__history" onClick={() => onViewHistory(item)}>History</button>
      </div>
    </details>
  )
}
