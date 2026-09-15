import { useEffect, useState, type FormEvent } from 'react'

import { Dialog } from '../../../components/ui/Dialog'
import type { Project, ProjectFormValues } from '../types'
import { EntityFormActions } from './EntityFormActions'
import { NotesField } from './NotesField'
import { TextInputField } from './TextInputField'

interface ProjectFormDialogProps {
  error: string | null
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: ProjectFormValues) => Promise<void>
  project: Project | null
}

function getInitialValues(project: Project | null): ProjectFormValues {
  return {
    projectName: project?.project_name ?? '',
    notes: project?.notes ?? '',
    isActive: project?.is_active ?? true,
  }
}

export function ProjectFormDialog({ error, isOpen, isSaving, onClose, onSubmit, project }: ProjectFormDialogProps) {
  const [values, setValues] = useState(() => getInitialValues(project))
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setValues(getInitialValues(project))
      setValidationError(null)
    }
  }, [isOpen, project])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!values.projectName.trim()) {
      setValidationError('Project name is required.')
      return
    }

    await onSubmit(values)
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={project ? 'Edit project' : 'New project'}>
      <form className="entity-form" onSubmit={handleSubmit}>
        <TextInputField hasError={Boolean(validationError)} id="project-name" label="Project name" onChange={(projectName) => setValues({ ...values, projectName })} value={values.projectName} />
        <NotesField id="project-notes" onChange={(notes) => setValues({ ...values, notes })} value={values.notes} />
        <label className="checkbox-field">
          <input checked={values.isActive} onChange={(event) => setValues({ ...values, isActive: event.target.checked })} type="checkbox" />
          <span>Project is active</span>
        </label>
        {validationError || error ? <p className="form-error" role="alert">{validationError ?? error}</p> : null}
        <EntityFormActions isSaving={isSaving} onCancel={onClose} submitLabel={project ? 'Save changes' : 'Create project'} />
      </form>
    </Dialog>
  )
}
