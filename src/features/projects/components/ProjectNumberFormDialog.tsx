import { useEffect, useState, type FormEvent } from 'react'

import { Dialog } from '../../../components/ui/Dialog'
import type { ProjectNumber, ProjectNumberFormValues } from '../types'
import { EntityFormActions } from './EntityFormActions'
import { NotesField } from './NotesField'
import { StatusSelect } from './StatusSelect'
import { TextInputField } from './TextInputField'

interface ProjectNumberFormDialogProps {
  error: string | null
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: ProjectNumberFormValues) => Promise<void>
  projectNumber: ProjectNumber | null
}

function getInitialValues(projectNumber: ProjectNumber | null): ProjectNumberFormValues {
  return {
    projectNumber: projectNumber?.project_number ?? '',
    status: projectNumber?.status ?? 'active',
    notes: projectNumber?.notes ?? '',
  }
}

export function ProjectNumberFormDialog({ error, isOpen, isSaving, onClose, onSubmit, projectNumber }: ProjectNumberFormDialogProps) {
  const [values, setValues] = useState(() => getInitialValues(projectNumber))
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setValues(getInitialValues(projectNumber))
      setValidationError(null)
    }
  }, [isOpen, projectNumber])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!values.projectNumber.trim()) {
      setValidationError('Project number is required.')
      return
    }

    await onSubmit(values)
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={projectNumber ? 'Edit project number' : 'New project number'}>
      <form className="entity-form" onSubmit={handleSubmit}>
        <TextInputField hasError={Boolean(validationError)} id="project-number" label="Project number" onChange={(projectNumber) => setValues({ ...values, projectNumber })} value={values.projectNumber} />
        <StatusSelect id="project-number-status" onChange={(status) => setValues({ ...values, status })} value={values.status} />
        <NotesField id="project-number-notes" onChange={(notes) => setValues({ ...values, notes })} value={values.notes} />
        {validationError || error ? <p className="form-error" role="alert">{validationError ?? error}</p> : null}
        <EntityFormActions isSaving={isSaving} onCancel={onClose} submitLabel={projectNumber ? 'Save changes' : 'Create project number'} />
      </form>
    </Dialog>
  )
}
