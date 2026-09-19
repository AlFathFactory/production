import { formatPcs } from '../utils/formatOperational'
import type { StageProgress } from '../utils/computeOperationalSummary'
import { DashboardCard } from './DashboardCard'
import './StageProgressCards.css'

interface StageProgressCardsProps {
  stages: StageProgress[]
}

const STAGE_LABELS: Record<StageProgress['stage'], string> = {
  CUT: 'CUT',
  OUT_BEND: 'OUT BEND',
  BEND: 'BEND',
}

export function StageProgressCards({ stages }: StageProgressCardsProps) {
  return (
    <DashboardCard title="Production Progress">
      <ul className="opc-stages">
        {stages.map((stage) => {
          const total = stage.completedQty + stage.remainingQty
          const percent = total > 0 ? Math.round((stage.completedQty / total) * 100) : 0
          return (
            <li key={stage.stage} className="opc-stages__item">
              <div className="opc-stages__header">
                <strong>{STAGE_LABELS[stage.stage]}</strong>
                <span>{percent}%</span>
              </div>
              <div className="opc-stages__bar" aria-hidden="true">
                <span style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
              </div>
              <div className="opc-stages__values">
                <span>Completed: {formatPcs(stage.completedQty)}</span>
                <span>Remaining: {formatPcs(stage.remainingQty)}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </DashboardCard>
  )
}
