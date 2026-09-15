import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { StatusBadge } from '../../../components/shared/StatusBadge'
import type { ProjectNumber } from '../types'

interface ProjectNumbersListProps {
  canManage: boolean
  error: string | null
  isLoading: boolean
  onDelete: (projectNumber: ProjectNumber) => void
  onEdit: (projectNumber: ProjectNumber) => void
  onNew: () => void
  onRetry: () => void
  onSelect: (projectNumberId: string) => void
  projectName: string
  projectNumbers: ProjectNumber[]
  selectedProjectNumberId: string | null
}

export function ProjectNumbersList({ canManage, error, isLoading, onDelete, onEdit, onNew, onRetry, onSelect, projectName, projectNumbers, selectedProjectNumberId }: ProjectNumbersListProps) {
  return (
    <section className="hierarchy-section">
      <div className="hierarchy-section__heading">
        <div><h3>Project numbers</h3><p>{projectName}</p></div>
        {canManage ? <button className="text-action" onClick={onNew} type="button">+ New project number</button> : null}
      </div>
      {isLoading ? <div className="panel-state"><LoadingSpinner label="Loading project numbers" size="small" /> Loading project numbers…</div> : null}
      {error ? <div className="panel-state panel-state--error"><p>{error}</p><button onClick={onRetry} type="button">Try again</button></div> : null}
      {!isLoading && !error && projectNumbers.length === 0 ? <div className="panel-state">No project numbers for {projectName}.</div> : null}
      {!isLoading && !error && projectNumbers.length > 0 ? <div className="hierarchy-list">
        {projectNumbers.map((projectNumber) => <div className={`hierarchy-list__item${selectedProjectNumberId === projectNumber.id ? ' hierarchy-list__item--selected' : ''}`} key={projectNumber.id}>
          <button aria-pressed={selectedProjectNumberId === projectNumber.id} className="hierarchy-list__select" onClick={() => onSelect(projectNumber.id)} type="button"><strong>{projectNumber.project_number}</strong><StatusBadge status={projectNumber.status} /></button>
          {canManage ? <div className="hierarchy-list__actions"><button aria-label={`Edit project number ${projectNumber.project_number}`} onClick={() => onEdit(projectNumber)} type="button">Edit</button><button aria-label={`Delete project number ${projectNumber.project_number}`} onClick={() => onDelete(projectNumber)} type="button">Delete</button></div> : null}
        </div>)}
      </div> : null}
    </section>
  )
}
