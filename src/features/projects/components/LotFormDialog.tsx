import { useEffect, useState, type FormEvent } from 'react'

import { Dialog } from '../../../components/ui/Dialog'
import type { Lot, LotFormValues } from '../types'
import { EntityFormActions } from './EntityFormActions'
import { NotesField } from './NotesField'
import { StatusSelect } from './StatusSelect'
import { TextInputField } from './TextInputField'

interface LotFormDialogProps {
  error: string | null
  isOpen: boolean
  isSaving: boolean
  lot: Lot | null
  onClose: () => void
  onSubmit: (values: LotFormValues) => Promise<void>
}

function getInitialValues(lot: Lot | null): LotFormValues {
  return {
    lotNumber: lot?.lot_number ?? '',
    status: lot?.status ?? 'active',
    notes: lot?.notes ?? '',
  }
}

export function LotFormDialog({ error, isOpen, isSaving, lot, onClose, onSubmit }: LotFormDialogProps) {
  const [values, setValues] = useState(() => getInitialValues(lot))
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setValues(getInitialValues(lot))
      setValidationError(null)
    }
  }, [isOpen, lot])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!values.lotNumber.trim()) {
      setValidationError('Lot number is required.')
      return
    }

    await onSubmit(values)
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={lot ? 'Edit lot' : 'New lot'}>
      <form className="entity-form" onSubmit={handleSubmit}>
        <TextInputField hasError={Boolean(validationError)} id="lot-number" label="Lot number" onChange={(lotNumber) => setValues({ ...values, lotNumber })} value={values.lotNumber} />
        <StatusSelect id="lot-status" onChange={(status) => setValues({ ...values, status })} value={values.status} />
        <NotesField id="lot-notes" onChange={(notes) => setValues({ ...values, notes })} value={values.notes} />
        {validationError || error ? <p className="form-error" role="alert">{validationError ?? error}</p> : null}
        <EntityFormActions isSaving={isSaving} onCancel={onClose} submitLabel={lot ? 'Save changes' : 'Create lot'} />
      </form>
    </Dialog>
  )
}
