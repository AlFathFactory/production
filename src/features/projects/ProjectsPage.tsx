import { useEffect, useState } from 'react'

import { PageHeader } from '../../components/shared/PageHeader'
import { AppNotification } from '../../components/ui/AppNotification'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../auth/hooks/useAuth'
import { canManageProjects } from '../auth/permissions'
import { useLotMutations } from './mutations/useLotMutations'
import { useProjectMutations } from './mutations/useProjectMutations'
import { useProjectNumberMutations } from './mutations/useProjectNumberMutations'
import { useLots } from './queries/useLots'
import { useProjectNumbers } from './queries/useProjectNumbers'
import { useProjects } from './queries/useProjects'
import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog'
import { LotFormDialog } from './components/LotFormDialog'
import { LotsList } from './components/LotsList'
import { ProjectDetails } from './components/ProjectDetails'
import { ProjectFormDialog } from './components/ProjectFormDialog'
import { ProjectNumberFormDialog } from './components/ProjectNumberFormDialog'
import { ProjectNumbersList } from './components/ProjectNumbersList'
import { ProjectsList } from './components/ProjectsList'
import type { Lot, LotFormValues, Project, ProjectFormValues, ProjectNumber, ProjectNumberFormValues } from './types'

type ProjectDialogState = Project | 'new' | null
type ProjectNumberDialogState = ProjectNumber | 'new' | null
type LotDialogState = Lot | 'new' | null
type DeleteTarget =
  | { type: 'project'; entity: Project }
  | { type: 'projectNumber'; entity: ProjectNumber }
  | { type: 'lot'; entity: Lot }
  | null

function getErrorMessage(error: unknown): string | null {
  return error instanceof Error ? error.message : null
}

export function ProjectsPage() {
  const { userProfile } = useAuth()
  const canManage = Boolean(userProfile && canManageProjects(userProfile.role))
  const projectsQuery = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedProjectNumberId, setSelectedProjectNumberId] = useState<string | null>(null)
  const [projectDialog, setProjectDialog] = useState<ProjectDialogState>(null)
  const [projectNumberDialog, setProjectNumberDialog] = useState<ProjectNumberDialogState>(null)
  const [lotDialog, setLotDialog] = useState<LotDialogState>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const projectMutations = useProjectMutations()
  const projectNumberMutations = useProjectNumberMutations()
  const lotMutations = useLotMutations()
  const projects = projectsQuery.data ?? []
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null
  const projectNumbersQuery = useProjectNumbers(selectedProjectId)
  const projectNumbers = projectNumbersQuery.data ?? []
  const selectedProjectNumber = projectNumbers.find((projectNumber) => projectNumber.id === selectedProjectNumberId) ?? null
  const lotsQuery = useLots(selectedProjectNumberId)

  useEffect(() => {
    if (selectedProjectId && !selectedProject) {
      setSelectedProjectId(null)
      setSelectedProjectNumberId(null)
    }
  }, [selectedProject, selectedProjectId])

  useEffect(() => {
    if (selectedProjectNumberId && !selectedProjectNumber) {
      setSelectedProjectNumberId(null)
    }
  }, [selectedProjectNumber, selectedProjectNumberId])

  function selectProject(projectId: string) {
    setSelectedProjectId(projectId)
    setSelectedProjectNumberId(null)
  }

  function closeProjectDialog() {
    projectMutations.createProject.reset()
    projectMutations.updateProject.reset()
    setProjectDialog(null)
  }

  function closeProjectNumberDialog() {
    projectNumberMutations.createProjectNumber.reset()
    projectNumberMutations.updateProjectNumber.reset()
    setProjectNumberDialog(null)
  }

  function closeLotDialog() {
    lotMutations.createLot.reset()
    lotMutations.updateLot.reset()
    setLotDialog(null)
  }

  function closeDeleteDialog() {
    projectMutations.deleteProject.reset()
    projectNumberMutations.deleteProjectNumber.reset()
    lotMutations.deleteLot.reset()
    setDeleteTarget(null)
  }

  async function saveProject(values: ProjectFormValues) {
    try {
      const action = projectDialog === 'new' ? 'created' : 'updated'
      if (projectDialog === 'new') {
        await projectMutations.createProject.mutateAsync(values)
      } else {
        await projectMutations.updateProject.mutateAsync({ id: projectDialog!.id, ...values })
      }
      closeProjectDialog()
      setSuccessMessage(`Project ${action} successfully.`)
    } catch {
      // Mutation state supplies a concise message to the dialog.
    }
  }

  async function saveProjectNumber(values: ProjectNumberFormValues) {
    if (!selectedProjectId) return
    try {
      const action = projectNumberDialog === 'new' ? 'created' : 'updated'
      if (projectNumberDialog === 'new') {
        await projectNumberMutations.createProjectNumber.mutateAsync({ projectId: selectedProjectId, ...values })
      } else {
        await projectNumberMutations.updateProjectNumber.mutateAsync({ id: projectNumberDialog!.id, projectId: selectedProjectId, ...values })
      }
      closeProjectNumberDialog()
      setSuccessMessage(`Project number ${action} successfully.`)
    } catch {
      // Mutation state supplies a concise message to the dialog.
    }
  }

  async function saveLot(values: LotFormValues) {
    if (!selectedProjectNumberId) return
    try {
      const action = lotDialog === 'new' ? 'created' : 'updated'
      if (lotDialog === 'new') {
        await lotMutations.createLot.mutateAsync({ projectNumberId: selectedProjectNumberId, ...values })
      } else {
        await lotMutations.updateLot.mutateAsync({ id: lotDialog!.id, projectNumberId: selectedProjectNumberId, ...values })
      }
      closeLotDialog()
      setSuccessMessage(`Lot ${action} successfully.`)
    } catch {
      // Mutation state supplies a concise message to the dialog.
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      const deletedEntity = deleteTarget.type === 'projectNumber' ? 'Project number' : deleteTarget.type === 'project' ? 'Project' : 'Lot'
      if (deleteTarget.type === 'project') {
        await projectMutations.deleteProject.mutateAsync(deleteTarget.entity.id)
        setSelectedProjectId(null)
        setSelectedProjectNumberId(null)
      }
      if (deleteTarget.type === 'projectNumber' && selectedProjectId) {
        await projectNumberMutations.deleteProjectNumber.mutateAsync({ id: deleteTarget.entity.id, projectId: selectedProjectId })
        setSelectedProjectNumberId(null)
      }
      if (deleteTarget.type === 'lot' && selectedProjectNumberId) {
        await lotMutations.deleteLot.mutateAsync({ id: deleteTarget.entity.id, projectNumberId: selectedProjectNumberId })
      }
      closeDeleteDialog()
      setSuccessMessage(`${deletedEntity} deleted successfully.`)
    } catch {
      // Mutation state supplies a concise message to the dialog.
    }
  }

  const deleteMutation = deleteTarget?.type === 'project'
    ? projectMutations.deleteProject
    : deleteTarget?.type === 'projectNumber'
      ? projectNumberMutations.deleteProjectNumber
      : lotMutations.deleteLot

  return (
    <section className="projects-page">
      {successMessage ? (
        <AppNotification
          key={successMessage}
          autoDismissMs={5000}
          onDismiss={() => setSuccessMessage(null)}
          title="Action completed"
        >
          <span>{successMessage}</span>
        </AppNotification>
      ) : null}
      <PageHeader
        title="Projects"
        description="Manage project, project number, and lot hierarchy."
        actions={canManage ? <Button onClick={() => setProjectDialog('new')} type="button">+ New project</Button> : undefined}
      />
      <div className="projects-workspace">
        <ProjectsList canManage={canManage} error={getErrorMessage(projectsQuery.error)} isLoading={projectsQuery.isPending} onRetry={() => void projectsQuery.refetch()} onSelect={selectProject} projects={projects} selectedProjectId={selectedProjectId} />
        <div className="projects-details">
          <ProjectDetails canManage={canManage} onDelete={() => selectedProject && setDeleteTarget({ type: 'project', entity: selectedProject })} onEdit={() => selectedProject && setProjectDialog(selectedProject)} project={selectedProject} />
          {selectedProject ? <ProjectNumbersList canManage={canManage} error={getErrorMessage(projectNumbersQuery.error)} isLoading={projectNumbersQuery.isPending} onDelete={(entity) => setDeleteTarget({ type: 'projectNumber', entity })} onEdit={setProjectNumberDialog} onNew={() => setProjectNumberDialog('new')} onRetry={() => void projectNumbersQuery.refetch()} onSelect={setSelectedProjectNumberId} projectName={selectedProject.project_name} projectNumbers={projectNumbers} selectedProjectNumberId={selectedProjectNumberId} /> : null}
          {selectedProjectNumber ? <LotsList canManage={canManage} error={getErrorMessage(lotsQuery.error)} isLoading={lotsQuery.isPending} lotReference={selectedProjectNumber.project_number} lots={lotsQuery.data ?? []} onDelete={(entity) => setDeleteTarget({ type: 'lot', entity })} onEdit={setLotDialog} onNew={() => setLotDialog('new')} onRetry={() => void lotsQuery.refetch()} /> : null}
        </div>
      </div>
      <ProjectFormDialog error={getErrorMessage(projectDialog === 'new' ? projectMutations.createProject.error : projectMutations.updateProject.error)} isOpen={Boolean(projectDialog)} isSaving={projectMutations.createProject.isPending || projectMutations.updateProject.isPending} onClose={closeProjectDialog} onSubmit={saveProject} project={projectDialog === 'new' ? null : projectDialog} />
      <ProjectNumberFormDialog error={getErrorMessage(projectNumberDialog === 'new' ? projectNumberMutations.createProjectNumber.error : projectNumberMutations.updateProjectNumber.error)} isOpen={Boolean(projectNumberDialog)} isSaving={projectNumberMutations.createProjectNumber.isPending || projectNumberMutations.updateProjectNumber.isPending} onClose={closeProjectNumberDialog} onSubmit={saveProjectNumber} projectNumber={projectNumberDialog === 'new' ? null : projectNumberDialog} />
      <LotFormDialog error={getErrorMessage(lotDialog === 'new' ? lotMutations.createLot.error : lotMutations.updateLot.error)} isOpen={Boolean(lotDialog)} isSaving={lotMutations.createLot.isPending || lotMutations.updateLot.isPending} lot={lotDialog === 'new' ? null : lotDialog} onClose={closeLotDialog} onSubmit={saveLot} />
      <DeleteConfirmationDialog error={getErrorMessage(deleteMutation.error)} isDeleting={deleteMutation.isPending} isOpen={Boolean(deleteTarget)} onClose={closeDeleteDialog} onConfirm={confirmDelete} subject={deleteTarget?.type === 'project' ? `project “${deleteTarget.entity.project_name}”` : deleteTarget?.type === 'projectNumber' ? `project number “${deleteTarget.entity.project_number}”` : deleteTarget ? `lot “${deleteTarget.entity.lot_number}”` : 'record'} />
    </section>
  )
}
