import { useState, useEffect } from 'react'
import type { ProductionStageEntry } from '../types'

import { Button } from '../../../../components/ui/Button'
import { Dialog } from '../../../../components/ui/Dialog'
import { FormField } from '../../../../components/ui/FormField'
import { Textarea } from '../../../../components/ui/Textarea'

interface DeleteEntryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
  entry: ProductionStageEntry | null
  isDeleting: boolean
  error: string | null
}

export function DeleteEntryDialog({ isOpen, onClose, onSubmit, entry, isDeleting, error }: DeleteEntryDialogProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    setReason('')
  }, [entry])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit(reason)
  }

  if (!isOpen || !entry) return null

  return (
    <Dialog title="Delete Stage Entry" onClose={onClose} isOpen={isOpen} isCloseDisabled={isDeleting}>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <p className="delete-confirmation">
          Are you sure you want to delete this <strong>{entry.stage}</strong> entry?
        </p>
        <p className="delete-confirmation">
          Date: <strong>{new Date(entry.entryDate).toLocaleDateString()}</strong>,
          Quantity: <strong>{entry.quantity}</strong>,
          Performed by: <strong>{entry.performedByName ?? '—'}</strong>
        </p>

        <FormField label="Deletion Reason" htmlFor="delete-reason">
          <Textarea
            id="delete-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for deletion (required)"
            required
            disabled={isDeleting}
          />
        </FormField>

        <div className="entity-form__actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete Entry'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}