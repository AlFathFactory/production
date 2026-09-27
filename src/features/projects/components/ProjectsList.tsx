import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import type { Project } from '../types'

interface ProjectsListProps {
  canManage: boolean
  error: string | null
  isLoading: boolean
  onRetry: () => void
  onSelect: (projectId: string) => void
  projects: Project[]
  selectedProjectId: string | null
}

export function ProjectsList({ canManage, error, isLoading, onRetry, onSelect, projects, selectedProjectId }: ProjectsListProps) {
  return (
    <section aria-label="Projects" className="projects-panel projects-panel--list">
      <div className="projects-panel__heading"><h2>Projects</h2><span>{projects.length}</span></div>
      {isLoading ? <div className="panel-state"><LoadingSpinner label="Loading projects" size="small" /> Loading projects…</div> : null}
      {error ? <div className="panel-state panel-state--error"><p>{error}</p><button onClick={onRetry} type="button">Try again</button></div> : null}
      {!isLoading && !error && projects.length === 0 ? <div className="panel-state">{canManage ? 'No projects yet. Create the first project.' : 'No projects are available.'}</div> : null}
      {!isLoading && !error && projects.length > 0 ? <div className="project-list">
        {projects.map((project) => <button aria-pressed={selectedProjectId === project.id} className={`project-list__item${selectedProjectId === project.id ? ' project-list__item--selected' : ''}`} key={project.id} onClick={() => onSelect(project.id)} type="button">
          <span dir="auto">{project.project_name}</span>
          {!project.is_active ? <small>Inactive</small> : null}
        </button>)}
      </div> : null}
    </section>
  )
}
