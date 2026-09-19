import type { NextOperation } from '../utils/computeOperationalSummary'
import { DashboardCard } from './DashboardCard'
import './NextOperationsCards.css'

interface NextOperationsCardsProps {
  operations: NextOperation[]
}

export function NextOperationsCards({ operations }: NextOperationsCardsProps) {
  return (
    <DashboardCard title="What should we do next?">
      <ul className="opc-next">
        {operations.map((operation) => (
          <li key={operation.key} className="opc-next__item">
            <span className="opc-next__label">{operation.label}</span>
            <strong className="opc-next__count">
              {operation.itemCount} {operation.itemCount === 1 ? 'Item' : 'Items'}
            </strong>
          </li>
        ))}
      </ul>
    </DashboardCard>
  )
}
