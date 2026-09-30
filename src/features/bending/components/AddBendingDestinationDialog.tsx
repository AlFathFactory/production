import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'

interface AddBendingDestinationDialogProps {
  error: string | null
  initialName: string
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

export function AddBendingDestinationDialog({ error, initialName, isOpen, isSaving, onClose, onSubmit }: AddBendingDestinationDialogProps) {
  const [name, setName] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setValidationError(null)
    }
  }, [initialName, isOpen])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setValidationError('Destination name is required.')
      return
    }
    await onSubmit(trimmedName)
  }

  return (
    <Dialog isCloseDisabled={isSaving} isOpen={isOpen} onClose={onClose} title="Add New Destination">
      <form className="entity-form" onSubmit={(event) => void submit(event)}>
        <FormField label="Destination Name *" htmlFor="new-bending-destination-name">
          <Input
            autoFocus
            disabled={isSaving}
            hasError={Boolean(validationError || error)}
            id="new-bending-destination-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setValidationError(null)
            }}
          />
        </FormField>
        {validationError || error ? <p className="form-error" role="alert">{validationError ?? error}</p> : null}
        <div className="entity-form__actions">
          <Button disabled={isSaving} type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button isLoading={isSaving} type="submit">Save</Button>
        </div>
      </form>
    </Dialog>
  )
}
