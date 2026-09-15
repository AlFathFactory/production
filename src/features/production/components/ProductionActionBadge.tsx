import type { ProductionNextAction } from '../types'

function asAction(value: string | null): ProductionNextAction | null {
  return value === 'CUT' || value === 'OUT_BEND' || value === 'BEND' || value === 'ROLLING' || value === 'DISPENSE' || value === 'COMPLETE'
    ? value
    : null
}

export function ProductionActionBadge({ action }: { action: string | null }) {
  const nextAction = asAction(action)

  if (!nextAction) {
    return <span className="production-action-badge production-action-badge--unknown">—</span>
  }

  return <span className={`production-action-badge production-action-badge--${nextAction.toLowerCase()}`}>{nextAction}</span>
}
