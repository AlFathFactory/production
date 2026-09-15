import { useState, type FormEvent } from 'react'

import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import type { AddProductionStageEntryInput, DirectStageAction, ProductionSearchRow } from '../types'
import { formatQuantity, getCurrentDateInputValue } from '../utils'

type StageEntryValues = Omit<AddProductionStageEntryInput, 'productionItemId' | 'stage'>

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : 'Production progress could not be added. Please try again.'
}

interface StageEntryDialogProps {
  action: DirectStageAction | null
  isOpen: boolean
  item: ProductionSearchRow | null
  onClose: () => void
  onSubmit: (values: StageEntryValues) => Promise<void>
}

export function StageEntryDialog({ action, isOpen, item, onClose, onSubmit }: StageEntryDialogProps) {
  const [quantity, setQuantity] = useState('')
  const [entryDate, setEntryDate] = useState(getCurrentDateInputValue)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetAndClose = () => {
    setQuantity('')
    setEntryDate(getCurrentDateInputValue())
    setNote('')
    setError(null)
    onClose()
  }

  const closeDialog = () => {
    if (!isSubmitting) {
      resetAndClose()
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const entryQuantity = Number(quantity)

    if (!action || !item) {
      return
    }
    if (!quantity.trim() || !Number.isFinite(entryQuantity) || entryQuantity <= 0) {
      setError('Quantity must be greater than zero.')
      return
    }
    if (entryQuantity > action.availableQuantity) {
      setError(`Quantity exceeds the currently available ${formatQuantity(action.availableQuantity)}.`)
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
      setError('Enter a valid entry date.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({ entryDate, note, quantity: entryQuantity })
      resetAndClose()
    } catch (submissionError) {
      setError(messageFromError(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = action ? `Add ${action.stage} Progress` : 'Add Production Progress'

  return (
    <Dialog isOpen={isOpen} onClose={closeDialog} title={title}>
      <form className="production-form" onSubmit={(event) => void submit(event)}>
        {item && action ? (
          <dl className="stage-entry-details">
            <div><dt>Article</dt><dd>{item.article ?? '—'}</dd></div>
            <div><dt>Stage</dt><dd>{action.stage}</dd></div>
            <div><dt>Available</dt><dd>{formatQuantity(action.availableQuantity)}</dd></div>
          </dl>
        ) : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <FormField label="Quantity *" htmlFor="stage-quantity">
          <Input id="stage-quantity" min="0" step="any" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </FormField>
        <FormField label="Entry Date *" htmlFor="stage-entry-date">
          <Input id="stage-entry-date" type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} />
        </FormField>
        <FormField label="Note" htmlFor="stage-note">
          <Textarea id="stage-note" value={note} onChange={(event) => setNote(event.target.value)} />
        </FormField>
        <div className="entity-form__actions">
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={closeDialog}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Add Progress</Button>
        </div>
      </form>
    </Dialog>
  )
}
