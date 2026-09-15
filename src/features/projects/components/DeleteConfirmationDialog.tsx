import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'

interface DeleteConfirmationDialogProps {
  error: string | null
  isDeleting: boolean
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  subject: string
}

export function DeleteConfirmationDialog({ error, isDeleting, isOpen, onClose, onConfirm, subject }: DeleteConfirmationDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Delete ${subject}?`}>
      <div className="delete-confirmation">
        <p>This action may fail if related project numbers, lots, or production data exist.</p>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="entity-form__actions">
          <Button onClick={onClose} type="button" variant="secondary">Cancel</Button>
          <Button isLoading={isDeleting} onClick={() => void onConfirm()} type="button" variant="danger">Delete</Button>
        </div>
      </div>
    </Dialog>
  )
}
