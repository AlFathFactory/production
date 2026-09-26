import { FormField } from '../../../components/ui/FormField'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { Select } from '../../../components/ui/Select'
import { useLots } from '../../projects/queries/useLots'
import { useProjectNumbers } from '../../projects/queries/useProjectNumbers'
import { useProjects } from '../../projects/queries/useProjects'

interface ProjectLotSelectorProps {
  ariaLabel?: string
  idPrefix?: string
  projectId: string | null
  projectNumberId: string | null
  lotId: string | null
  onProjectChange: (projectId: string | null, label: string | null) => void
  onProjectNumberChange: (projectNumberId: string | null, label: string | null) => void
  onLotChange: (lotId: string | null, label: string | null) => void
  emptyOptionLabels?: {
    project: string
    projectNumber: string
    lot: string
  }
}

function SelectorError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <p className="production-selector__error" role="alert">
      {message} <button type="button" onClick={onRetry}>Retry</button>
    </p>
  )
}

export function ProjectLotSelector({
  ariaLabel = 'Production hierarchy selection',
  idPrefix = 'production',
  projectId,
  projectNumberId,
  lotId,
  onProjectChange,
  onProjectNumberChange,
  onLotChange,
  emptyOptionLabels,
}: ProjectLotSelectorProps) {
  const projectsQuery = useProjects()
  const projectNumbersQuery = useProjectNumbers(projectId)
  const lotsQuery = useLots(projectNumberId)
  const projectInputId = `${idPrefix}-project`
  const projectNumberInputId = `${idPrefix}-project-number`
  const lotInputId = `${idPrefix}-lot`
  const projects = projectsQuery.data ?? []
  const projectNumbers = projectNumbersQuery.data ?? []
  const lots = lotsQuery.data ?? []
  const hasNoProjects = !projectsQuery.isLoading && !projectsQuery.isError && projects.length === 0
  const hasNoProjectNumbers = hasNoProjects || (
    Boolean(projectId)
    && !projectNumbersQuery.isLoading
    && !projectNumbersQuery.isError
    && projectNumbers.length === 0
  )

  const projectPlaceholder = projectsQuery.isLoading
    ? 'Loading projects…'
    : projects.length === 0
      ? 'No Projects available'
      : emptyOptionLabels?.project ?? 'Select a project'
  const projectNumberPlaceholder = hasNoProjects
    ? 'No Project Numbers available'
    : !projectId
      ? 'Select a project first'
      : projectNumbersQuery.isLoading
        ? 'Loading project numbers…'
        : projectNumbers.length === 0
          ? 'No Project Numbers available'
          : emptyOptionLabels?.projectNumber ?? 'Select a project number'
  const lotPlaceholder = hasNoProjectNumbers
    ? 'No Lots available'
    : !projectNumberId
      ? 'Select a project number first'
      : lotsQuery.isLoading
        ? 'Loading lots…'
        : lots.length === 0
          ? 'No Lots available'
          : emptyOptionLabels?.lot ?? 'Select a lot'

  return (
    <section className="production-selector" aria-label={ariaLabel}>
      <FormField label="Project" htmlFor={projectInputId}>
        <Select
          id={projectInputId}
          value={projectId ?? ''}
          disabled={projectsQuery.isLoading}
          onChange={(event) => {
            const id = event.target.value || null
            const project = projectsQuery.data?.find((candidate) => candidate.id === id)
            onProjectChange(id, project?.project_name ?? null)
          }}
        >
          <option value="">{projectPlaceholder}</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.project_name}</option>)}
        </Select>
        {projectsQuery.isLoading ? <LoadingSpinner size="small" label="Loading projects" /> : null}
        {projectsQuery.isError ? <SelectorError message="Projects could not be loaded." onRetry={() => void projectsQuery.refetch()} /> : null}
      </FormField>

      <FormField label="Project Number" htmlFor={projectNumberInputId}>
        <Select
          id={projectNumberInputId}
          value={projectNumberId ?? ''}
          disabled={!projectId || projectNumbersQuery.isLoading}
          onChange={(event) => {
            const id = event.target.value || null
            const projectNumber = projectNumbersQuery.data?.find((candidate) => candidate.id === id)
            onProjectNumberChange(id, projectNumber?.project_number ?? null)
          }}
        >
          <option value="">{projectNumberPlaceholder}</option>
          {projectNumbers.map((projectNumber) => <option key={projectNumber.id} value={projectNumber.id}>{projectNumber.project_number}</option>)}
        </Select>
        {projectNumbersQuery.isLoading ? <LoadingSpinner size="small" label="Loading project numbers" /> : null}
        {projectNumbersQuery.isError ? <SelectorError message="Project numbers could not be loaded." onRetry={() => void projectNumbersQuery.refetch()} /> : null}
      </FormField>

      <FormField label="Lot" htmlFor={lotInputId}>
        <Select
          id={lotInputId}
          value={lotId ?? ''}
          disabled={!projectNumberId || lotsQuery.isLoading}
          onChange={(event) => {
            const id = event.target.value || null
            const lot = lotsQuery.data?.find((candidate) => candidate.id === id)
            onLotChange(id, lot?.lot_number ?? null)
          }}
        >
          <option value="">{lotPlaceholder}</option>
          {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.lot_number}</option>)}
        </Select>
        {lotsQuery.isLoading ? <LoadingSpinner size="small" label="Loading lots" /> : null}
        {lotsQuery.isError ? <SelectorError message="Lots could not be loaded." onRetry={() => void lotsQuery.refetch()} /> : null}
      </FormField>
    </section>
  )
}
