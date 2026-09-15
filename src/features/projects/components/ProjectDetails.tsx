import { Button } from '../../../components/ui/Button'
import type { Project } from '../types'

interface ProjectDetailsProps {
  canManage: boolean
  onDelete: () => void
  onEdit: () => void
  project: Project | null
}

export function ProjectDetails({ canManage, onDelete, onEdit, project }: ProjectDetailsProps) {
  if (!project) {
    return <section className="projects-panel projects-panel--details panel-state">Select a project to view its project numbers and lots.</section>
  }

  return (
    <section className="projects-panel projects-panel--details">
      <div className="project-details__header">
        <div><p className="eyebrow">Selected project</p><h2>{project.project_name}</h2></div>
        {canManage ? <div className="project-details__actions"><Button onClick={onEdit} type="button" variant="secondary">Edit</Button><button className="danger-action" onClick={onDelete} type="button">Delete</button></div> : null}
      </div>
      <div className="project-details__meta"><span className={project.is_active ? 'project-state' : 'project-state project-state--inactive'}>{project.is_active ? 'Active project' : 'Inactive project'}</span>{project.notes ? <p>{project.notes}</p> : <p className="project-details__empty-notes">No project notes.</p>}</div>
    </section>
  )
}
