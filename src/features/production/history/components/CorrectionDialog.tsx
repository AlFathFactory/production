import { useState, useEffect } from 'react'
import type { ProductionStageEntry } from '../types'

import { Button } from '../../../../components/ui/Button'
import { Dialog } from '../../../../components/ui/Dialog'
import { FormField } from '../../../../components/ui/FormField'
import { Input } from '../../../../components/ui/Input'
import { Textarea } from '../../../../components/ui/Textarea'

interface CorrectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: { quantity: number; entryDate: string; note: string; reason: string }) => void
  entry: ProductionStageEntry | null
  isSaving: boolean
  error: string | null
}

export function CorrectionDialog({ isOpen, onClose, onSubmit, entry, isSaving, error }: CorrectionDialogProps) {
  const [formValues, setFormValues] = useState({
    quantity: '',
    entryDate: '',
    note: '',
    reason: '',
  })

  useEffect(() => {
    if (entry) {
      setFormValues({
        quantity: String(entry.quantity),
        entryDate: entry.entryDate,
        note: entry.note ?? '',
        reason: '',
      })
    } else {
      setFormValues({ quantity: '', entryDate: '', note: '', reason: '' })
    }
  }, [entry])

  function handleChange<K extends keyof typeof formValues>(field: K, value: string) {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit({
      quantity: Number(formValues.quantity),
      entryDate: formValues.entryDate,
      note: formValues.note,
      reason: formValues.reason,
    })
  }

  if (!isOpen || !entry) return null

  return (
    <Dialog title="Correct Stage Entry" onClose={onClose} isOpen={isOpen} isCloseDisabled={isSaving}>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <p className="production-history-dialog__intro">
          Correcting <strong>{entry.stage}</strong> entry from <strong>{entry.entryDate}</strong>
          (Source: {entry.source === 'manual' ? 'Manual' : entry.source === 'excel_import' ? 'Excel Import' : 'Bending Document'})
        </p>

        <FormField label="Quantity" htmlFor="correction-quantity">
          <Input
            id="correction-quantity"
            type="number"
            min="1"
            step="1"
            value={formValues.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            required
            disabled={isSaving}
          />
        </FormField>

        <FormField label="Entry Date" htmlFor="correction-entry-date">
          <Input
            id="correction-entry-date"
            type="date"
            value={formValues.entryDate}
            onChange={(e) => handleChange('entryDate', e.target.value)}
            required
            disabled={isSaving}
          />
        </FormField>

        <FormField label="Note" htmlFor="correction-note">
          <Textarea
            id="correction-note"
            value={formValues.note}
            onChange={(e) => handleChange('note', e.target.value)}
            placeholder="Optional note"
            disabled={isSaving}
          />
        </FormField>

        <FormField label="Correction Reason" htmlFor="correction-reason">
          <Textarea
            id="correction-reason"
            value={formValues.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            placeholder="Reason for correction (required)"
            required
            disabled={isSaving}
          />
        </FormField>

        <div className="entity-form__actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Correction'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}