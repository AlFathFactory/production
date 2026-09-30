import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'

interface AddDispenseRecipientDialogProps {
  error: string | null
  initialName: string
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

export function AddDispenseRecipientDialog({ error, initialName, isOpen, isSaving, onClose, onSubmit }: AddDispenseRecipientDialogProps) {
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
      setValidationError('Person name is required.')
      return
    }
    await onSubmit(trimmedName)
  }

  return (
    <Dialog isCloseDisabled={isSaving} isOpen={isOpen} onClose={onClose} title="Add New Person">
      <form className="entity-form" onSubmit={(event) => void submit(event)}>
        <FormField label="Person Name *" htmlFor="new-dispense-recipient-name">
          <Input
            autoFocus
            disabled={isSaving}
            hasError={Boolean(validationError || error)}
            id="new-dispense-recipient-name"
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
