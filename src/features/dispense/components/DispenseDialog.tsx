import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { normalizeSearchableName } from '../../../components/ui/SearchableNameCombobox'
import { Textarea } from '../../../components/ui/Textarea'
import { formatQuantity, getCurrentDateInputValue } from '../../production/utils'
import { DispenseRepositoryError } from '../dispenseRepository'
import { useCreateDispenseRecipient } from '../mutations/useCreateDispenseRecipient'
import { useDispenseRecipients } from '../queries/dispenseQueries'
import type { CreateProductionDispenseInput, DispenseSelectionItem } from '../types'
import { AddDispenseRecipientDialog } from './AddDispenseRecipientDialog'
import { DispenseRecipientCombobox } from './DispenseRecipientCombobox'

interface DispenseDialogProps {
  createdBy: string | null
  isOpen: boolean
  items: DispenseSelectionItem[]
  onClose: () => void
  onSubmit: (input: CreateProductionDispenseInput) => Promise<void>
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : 'The DISPENSE operation could not be completed. Please try again.'
}

export function DispenseDialog({ createdBy, isOpen, items, onClose, onSubmit }: DispenseDialogProps) {
  const recipientsQuery = useDispenseRecipients()
  const createRecipientMutation = useCreateDispenseRecipient()
  const [activeItems, setActiveItems] = useState<DispenseSelectionItem[]>([])
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [recipientName, setRecipientName] = useState('')
  const [entryDate, setEntryDate] = useState(getCurrentDateInputValue)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recipientError, setRecipientError] = useState<string | null>(null)
  const [isAddRecipientOpen, setIsAddRecipientOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setActiveItems(items)
    setQuantities(Object.fromEntries(items.map((item) => [item.productionItemId, ''])))
    setRecipientName('')
    setEntryDate(getCurrentDateInputValue())
    setNote('')
    setError(null)
    setRecipientError(null)
    setIsAddRecipientOpen(false)
  }, [isOpen, items])

  const closeDialog = () => {
    if (!isSubmitting && !createRecipientMutation.isPending) onClose()
  }

  const addRecipient = async (name: string) => {
    if (!createdBy) {
      setRecipientError('Your authenticated user could not be resolved. Please sign in again.')
      return
    }

    setRecipientError(null)
    try {
      const recipient = await createRecipientMutation.mutateAsync({ createdBy, name })
      await recipientsQuery.refetch()
      setRecipientName(recipient.name)
      setIsAddRecipientOpen(false)
    } catch (creationError) {
      if (creationError instanceof DispenseRepositoryError && creationError.kind === 'duplicate') {
        const refreshed = await recipientsQuery.refetch()
        const existing = refreshed.data?.find((recipient) => (
          normalizeSearchableName(recipient.name) === normalizeSearchableName(name)
        ))
        if (existing) {
          setRecipientName(existing.name)
          setIsAddRecipientOpen(false)
          return
        }
      }
      setRecipientError(messageFromError(creationError))
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const recipients = recipientsQuery.data ?? []
    const selectedRecipient = recipients.find((recipient) => (
      normalizeSearchableName(recipient.name) === normalizeSearchableName(recipientName)
    ))

    if (!selectedRecipient) {
      setError('Select a saved person or add a new person before dispensing.')
      return
    }
    if (activeItems.length === 0) {
      setError('Select at least one item to dispense.')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
      setError('Enter a valid entry date.')
      return
    }

    const dispenseItems = activeItems.map((item) => ({
      availableQuantity: item.availableQuantity,
      productionItemId: item.productionItemId,
      quantity: Number(quantities[item.productionItemId]),
    }))
    const invalidQuantity = dispenseItems.find((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)
    if (invalidQuantity) {
      setError('Every DISPENSE quantity must be greater than zero.')
      return
    }
    const excessiveQuantity = dispenseItems.find((item) => item.quantity > item.availableQuantity)
    if (excessiveQuantity) {
      const selectedItem = activeItems.find((item) => item.productionItemId === excessiveQuantity.productionItemId)
      setError(`Quantity for ${selectedItem?.article ?? 'an item'} exceeds the currently available ${formatQuantity(excessiveQuantity.availableQuantity)}.`)
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        entryDate,
        items: dispenseItems.map(({ productionItemId, quantity }) => ({ productionItemId, quantity })),
        note,
        recipientName: selectedRecipient.name,
      })
      onClose()
    } catch (submissionError) {
      setError(messageFromError(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog className="dialog--wide" isCloseDisabled={isSubmitting} isOpen={isOpen} onClose={closeDialog} title="Dispense Production Items">
        <form className="production-form" onSubmit={(event) => void submit(event)}>
          <p className="production-form__intro">All selected items will be dispensed to the same person in one operation.</p>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <DispenseRecipientCombobox
            isDisabled={isSubmitting || recipientsQuery.isPending || recipientsQuery.isError}
            onAdd={() => {
              setRecipientError(null)
              setIsAddRecipientOpen(true)
            }}
            onChange={(value) => {
              setRecipientName(value)
              setError(null)
            }}
            recipients={recipientsQuery.data ?? []}
            value={recipientName}
          />
          {recipientsQuery.isPending ? <p className="dispense-recipient-status">Loading saved people…</p> : null}
          {recipientsQuery.isError ? (
            <p className="form-error" role="alert">
              {recipientsQuery.error.message}{' '}
              <button type="button" onClick={() => void recipientsQuery.refetch()}>Retry</button>
            </p>
          ) : null}

          <div className="dispense-items-table-wrap">
            <table className="dispense-items-table">
              <thead>
                <tr>
                  <th scope="col">Article</th>
                  <th scope="col">Designation</th>
                  <th scope="col">Available</th>
                  <th scope="col">Quantity *</th>
                  <th scope="col"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {activeItems.map((item) => (
                  <tr key={item.productionItemId}>
                    <td dir="auto">{item.article}</td>
                    <td dir="auto">{item.designation ?? '—'}</td>
                    <td>{formatQuantity(item.availableQuantity)}</td>
                    <td>
                      <Input
                        aria-label={`DISPENSE quantity for ${item.article}`}
                        disabled={isSubmitting}
                        max={item.availableQuantity}
                        min="0"
                        step="any"
                        type="number"
                        value={quantities[item.productionItemId] ?? ''}
                        onChange={(event) => {
                          setQuantities((current) => ({ ...current, [item.productionItemId]: event.target.value }))
                          setError(null)
                        }}
                      />
                    </td>
                    <td>
                      <button
                        aria-label={`Remove ${item.article} from DISPENSE`}
                        className="dispense-items-table__remove"
                        disabled={isSubmitting}
                        type="button"
                        onClick={() => setActiveItems((current) => current.filter((candidate) => candidate.productionItemId !== item.productionItemId))}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {activeItems.length === 0 ? <p className="dispense-empty-items">No items selected.</p> : null}

          <div className="production-form__grid">
            <FormField label="Entry Date *" htmlFor="dispense-entry-date">
              <Input disabled={isSubmitting} id="dispense-entry-date" type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} />
            </FormField>
            <FormField label="Note" htmlFor="dispense-note">
              <Textarea disabled={isSubmitting} id="dispense-note" value={note} onChange={(event) => setNote(event.target.value)} />
            </FormField>
          </div>
          <div className="entity-form__actions">
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={closeDialog}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Dispense {activeItems.length} Item{activeItems.length === 1 ? '' : 's'}</Button>
          </div>
        </form>
      </Dialog>
      <AddDispenseRecipientDialog
        error={recipientError}
        initialName={recipientName}
        isOpen={isAddRecipientOpen}
        isSaving={createRecipientMutation.isPending}
        onClose={() => {
          if (!createRecipientMutation.isPending) {
            setRecipientError(null)
            setIsAddRecipientOpen(false)
          }
        }}
        onSubmit={addRecipient}
      />
    </>
  )
}
