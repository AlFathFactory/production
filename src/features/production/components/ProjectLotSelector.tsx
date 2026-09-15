import { FormField } from '../../../components/ui/FormField'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { Select } from '../../../components/ui/Select'
import { useLots } from '../../projects/queries/useLots'
import { useProjectNumbers } from '../../projects/queries/useProjectNumbers'
import { useProjects } from '../../projects/queries/useProjects'

interface ProjectLotSelectorProps {
  projectId: string | null
  projectNumberId: string | null
  lotId: string | null
  onProjectChange: (projectId: string | null, label: string | null) => void
  onProjectNumberChange: (projectNumberId: string | null, label: string | null) => void
  onLotChange: (lotId: string | null, label: string | null) => void
}

function SelectorError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <p className="production-selector__error" role="alert">
      {message} <button type="button" onClick={onRetry}>Retry</button>
    </p>
  )
}

export function ProjectLotSelector({
  projectId,
  projectNumberId,
  lotId,
  onProjectChange,
  onProjectNumberChange,
  onLotChange,
}: ProjectLotSelectorProps) {
  const projectsQuery = useProjects()
  const projectNumbersQuery = useProjectNumbers(projectId)
  const lotsQuery = useLots(projectNumberId)

  return (
    <section className="production-selector" aria-label="Production hierarchy selection">
      <FormField label="Project" htmlFor="production-project">
        <Select
          id="production-project"
          value={projectId ?? ''}
          disabled={projectsQuery.isPending}
          onChange={(event) => {
            const id = event.target.value || null
            const project = projectsQuery.data?.find((candidate) => candidate.id === id)
            onProjectChange(id, project?.project_name ?? null)
          }}
        >
          <option value="">{projectsQuery.isPending ? 'Loading projects…' : 'Select a project'}</option>
          {projectsQuery.data?.map((project) => <option key={project.id} value={project.id}>{project.project_name}</option>)}
        </Select>
        {projectsQuery.isPending ? <LoadingSpinner size="small" label="Loading projects" /> : null}
        {projectsQuery.isError ? <SelectorError message="Projects could not be loaded." onRetry={() => void projectsQuery.refetch()} /> : null}
      </FormField>

      <FormField label="Project Number" htmlFor="production-project-number">
        <Select
          id="production-project-number"
          value={projectNumberId ?? ''}
          disabled={!projectId || projectNumbersQuery.isPending || projectNumbersQuery.isError}
          onChange={(event) => {
            const id = event.target.value || null
            const projectNumber = projectNumbersQuery.data?.find((candidate) => candidate.id === id)
            onProjectNumberChange(id, projectNumber?.project_number ?? null)
          }}
        >
          <option value="">{projectNumbersQuery.isPending ? 'Loading project numbers…' : 'Select a project number'}</option>
          {projectNumbersQuery.data?.map((projectNumber) => <option key={projectNumber.id} value={projectNumber.id}>{projectNumber.project_number}</option>)}
        </Select>
        {projectNumbersQuery.isPending ? <LoadingSpinner size="small" label="Loading project numbers" /> : null}
        {projectNumbersQuery.isError ? <SelectorError message="Project numbers could not be loaded." onRetry={() => void projectNumbersQuery.refetch()} /> : null}
      </FormField>

      <FormField label="Lot" htmlFor="production-lot">
        <Select
          id="production-lot"
          value={lotId ?? ''}
          disabled={!projectNumberId || lotsQuery.isPending || lotsQuery.isError}
          onChange={(event) => {
            const id = event.target.value || null
            const lot = lotsQuery.data?.find((candidate) => candidate.id === id)
            onLotChange(id, lot?.lot_number ?? null)
          }}
        >
          <option value="">{lotsQuery.isPending ? 'Loading lots…' : 'Select a lot'}</option>
          {lotsQuery.data?.map((lot) => <option key={lot.id} value={lot.id}>{lot.lot_number}</option>)}
        </Select>
        {lotsQuery.isPending ? <LoadingSpinner size="small" label="Loading lots" /> : null}
        {lotsQuery.isError ? <SelectorError message="Lots could not be loaded." onRetry={() => void lotsQuery.refetch()} /> : null}
      </FormField>
    </section>
  )
}
