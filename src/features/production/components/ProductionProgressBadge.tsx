import { progressStateLabels } from '../constants'
import type { ProductionProgressState } from '../types'

function asProgressState(value: string | null): ProductionProgressState | null {
  return value === 'not_started' || value === 'in_progress' || value === 'completed' ? value : null
}

export function ProductionProgressBadge({ progressState }: { progressState: string | null }) {
  const state = asProgressState(progressState)

  if (!state) {
    return <span className="production-progress-badge production-progress-badge--unknown">Unknown</span>
  }

  return <span className={`production-progress-badge production-progress-badge--${state}`}>{progressStateLabels[state]}</span>
}
