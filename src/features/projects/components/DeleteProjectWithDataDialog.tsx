import { useEffect, useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import type { Project } from '../types'

interface DeleteProjectWithDataDialogProps {
  error: string | null
  isDeleting: boolean
  isOpen: boolean
  onClose: () => void
  onConfirm: (confirmation: string) => Promise<void>
  project: Project | null
}

const DELETED_CATEGORIES = [
  'Project Numbers',
  'Lots',
  'Production Items',
  'Production History (CUT, Issue Packing, Receive Packing, Rolling, Dispense)',
  'Bending Dispatches and Returns',
  'Production Imports',
  'Related audit/history data',
]

export function DeleteProjectWithDataDialog({
  error,
  isDeleting,
  isOpen,
  onClose,
  onConfirm,
  project,
}: DeleteProjectWithDataDialogProps) {
  const [confirmation, setConfirmation] = useState('')

  useEffect(() => {
    if (isOpen) {
      setConfirmation('')
    }
  }, [isOpen, project])

  if (!project) {
    return null
  }

  const isConfirmed = confirmation.trim() === project.project_name

  const closeDialog = () => {
    if (!isDeleting) {
      onClose()
    }
  }

  return (
    <Dialog
      isCloseDisabled={isDeleting}
      isOpen={isOpen}
      onClose={closeDialog}
      title="Delete Project & All Data?"
    >
      <div className="delete-confirmation">
        <p>
          You are about to permanently delete project <strong dir="auto">{project.project_name}</strong> and
          all of its Production data. This action cannot be undone.
        </p>
        <p>This will also delete:</p>
        <ul>
          {DELETED_CATEGORIES.map((category) => <li key={category}>{category}</li>)}
        </ul>
        <p>
          Shared people and destinations used by other projects are kept. Only this project&apos;s own
          transactions are removed.
        </p>
        <FormField label={`Type the project name (${project.project_name}) to confirm`} htmlFor="delete-project-confirmation">
          <Input
            autoComplete="off"
            dir="auto"
            disabled={isDeleting}
            hasError={Boolean(error)}
            id="delete-project-confirmation"
            placeholder={project.project_name}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </FormField>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="entity-form__actions">
          <Button disabled={isDeleting} onClick={closeDialog} type="button" variant="secondary">Cancel</Button>
          <Button
            disabled={!isConfirmed}
            isLoading={isDeleting}
            onClick={() => void onConfirm(confirmation.trim())}
            type="button"
            variant="danger"
          >
            {isDeleting ? 'Deleting Project & Data…' : 'Delete Project & Data'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
