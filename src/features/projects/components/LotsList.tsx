import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { StatusBadge } from '../../../components/shared/StatusBadge'
import type { Lot } from '../types'

interface LotsListProps {
  canManage: boolean
  error: string | null
  isLoading: boolean
  lotReference: string
  lots: Lot[]
  onDelete: (lot: Lot) => void
  onEdit: (lot: Lot) => void
  onNew: () => void
  onRetry: () => void
}

export function LotsList({ canManage, error, isLoading, lotReference, lots, onDelete, onEdit, onNew, onRetry }: LotsListProps) {
  return (
    <section className="hierarchy-section hierarchy-section--lots">
      <div className="hierarchy-section__heading">
        <div><h3>Lots</h3><p dir="auto">Project number {lotReference}</p></div>
        {canManage ? <button className="text-action" onClick={onNew} type="button">+ New lot</button> : null}
      </div>
      {isLoading ? <div className="panel-state"><LoadingSpinner label="Loading lots" size="small" /> Loading lots…</div> : null}
      {error ? <div className="panel-state panel-state--error"><p>{error}</p><button onClick={onRetry} type="button">Try again</button></div> : null}
      {!isLoading && !error && lots.length === 0 ? <div className="panel-state">No lots for project number {lotReference}.</div> : null}
      {!isLoading && !error && lots.length > 0 ? <div className="hierarchy-list">
        {lots.map((lot) => <div className="hierarchy-list__item" key={lot.id}>
          <div className="hierarchy-list__select"><strong dir="auto">Lot {lot.lot_number}</strong><StatusBadge status={lot.status} /></div>
          {canManage ? <div className="hierarchy-list__actions"><button aria-label={`Edit lot ${lot.lot_number}`} onClick={() => onEdit(lot)} type="button">Edit</button><button aria-label={`Delete lot ${lot.lot_number}`} onClick={() => onDelete(lot)} type="button">Delete</button></div> : null}
        </div>)}
      </div> : null}
    </section>
  )
}
