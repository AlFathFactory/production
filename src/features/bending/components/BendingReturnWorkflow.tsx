import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { formatQuantity, getCurrentDateInputValue } from '../../production/utils'
import { calculateReturnSummary } from '../returnValidation'
import { useBendingReturnDraft } from '../hooks/useBendingReturnDraft'
import { useCreateBendingReturn } from '../mutations/useCreateBendingReturn'
import { useBendingDispatches, useBendingReturnLines } from '../queries/bendingQueries'
import type { BendingReturnHeaderValues, BendingReturnSuccess } from '../types'
import { BendingDispatchSelector } from './BendingDispatchSelector'
import { BendingReturnHeaderFields } from './BendingReturnHeaderFields'
import { BendingReturnItemsTable } from './BendingReturnItemsTable'
import { BendingReturnSummary } from './BendingReturnSummary'

interface BendingReturnWorkflowProps {
  lotId: string
}

function initialHeaderValues(): BendingReturnHeaderValues {
  return { receivedByName: '', returnDate: getCurrentDateInputValue(), returnReference: '' }
}

function getDispatchStatus(lines: Array<{ outstandingQuantity: number; previousReturnedQuantity: number }>): string {
  if (lines.every((line) => line.outstandingQuantity === 0)) {
    return 'Fully Returned'
  }
  return lines.some((line) => line.previousReturnedQuantity > 0) ? 'Partially Returned' : 'Not Returned'
}

export function BendingReturnWorkflow({ lotId }: BendingReturnWorkflowProps) {
  const [selectedDispatchId, setSelectedDispatchId] = useState<string | null>(null)
  const [headerValues, setHeaderValues] = useState(initialHeaderValues)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<BendingReturnSuccess | null>(null)
  const dispatchesQuery = useBendingDispatches(lotId)
  const returnLinesQuery = useBendingReturnLines(selectedDispatchId)
  const draft = useBendingReturnDraft()
  const createReturnMutation = useCreateBendingReturn()
  const selectedDispatch = dispatchesQuery.data?.find((dispatch) => dispatch.id === selectedDispatchId) ?? null
  const returnableItems = draft.items.filter((item) => item.outstandingQuantity > 0 || item.quantity > 0)
  const hasOutstandingItems = (returnLinesQuery.data ?? []).some((item) => item.outstandingQuantity > 0)
  const canSubmit = Boolean(
    selectedDispatchId
    && headerValues.returnReference.trim()
    && headerValues.returnDate
    && draft.isValid
    && !createReturnMutation.isPending,
  )

  useEffect(() => {
    if (returnLinesQuery.data) {
      draft.syncLines(returnLinesQuery.data)
    }
  }, [draft.syncLines, returnLinesQuery.data])

  const selectDispatch = (dispatchId: string | null) => {
    setSelectedDispatchId(dispatchId)
    draft.clear()
    setHeaderValues(initialHeaderValues())
    setSubmitError(null)
    setSuccess(null)
  }

  const updateHeader = (field: keyof BendingReturnHeaderValues, value: string) => {
    setHeaderValues((current) => ({ ...current, [field]: value }))
    setSubmitError(null)
    setSuccess(null)
  }

  const createReturn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit || !selectedDispatchId) {
      return
    }

    const summary = calculateReturnSummary(draft.items)
    const submittedItems = draft.selectedItems.map((item) => ({
      dispatch_item_id: item.dispatchItemId,
      quantity: item.quantity,
    }))

    setSubmitError(null)
    setSuccess(null)
    try {
      const result = await createReturnMutation.mutateAsync({
        ...headerValues,
        dispatchId: selectedDispatchId,
        items: submittedItems,
        lotId,
      })
      setSuccess({
        itemCount: submittedItems.length,
        returnReference: result.return_reference,
        totalQuantity: summary.totalQuantity,
      })
      draft.clear()
      setHeaderValues(initialHeaderValues())
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The Bending Return could not be created. Please try again.')
    }
  }

  return (
    <div aria-labelledby="bending-return-tab" className="bending-return-workflow" id="bending-return-panel" role="tabpanel">
      {success ? (
        <p className="bending-feedback bending-feedback--success" role="status">
          Bending Return created successfully. <strong>Reference: {success.returnReference}</strong>
          <span>Items: {success.itemCount} · Total quantity: {formatQuantity(success.totalQuantity)}</span>
        </p>
      ) : null}
      <section className="bending-return-selector" aria-labelledby="bending-existing-dispatches">
        <div className="bending-section__heading">
          <div><span>Step 1</span><h2 id="bending-existing-dispatches">Existing Dispatches</h2></div>
          <p>Select the dispatch receiving material back from bending.</p>
        </div>
        {dispatchesQuery.isPending ? <p className="bending-loading"><LoadingSpinner label="Loading Bending Dispatches" /> Loading dispatches…</p> : null}
        {dispatchesQuery.isError ? (
          <p className="bending-feedback bending-feedback--error" role="alert">
            Dispatches could not be loaded.
            <Button type="button" variant="secondary" onClick={() => void dispatchesQuery.refetch()}>Retry</Button>
          </p>
        ) : null}
        {dispatchesQuery.isSuccess && dispatchesQuery.data.length === 0 ? <p className="bending-empty">No Bending Dispatches exist for this Lot.</p> : null}
        {dispatchesQuery.isSuccess && dispatchesQuery.data.length > 0 ? (
          <BendingDispatchSelector
            dispatches={dispatchesQuery.data}
            isDisabled={createReturnMutation.isPending}
            selectedDispatchId={selectedDispatchId}
            onChange={selectDispatch}
          />
        ) : null}
      </section>

      {selectedDispatch ? (
        <form className="bending-dispatch bending-return" onSubmit={(event) => void createReturn(event)}>
          <div className="bending-dispatch__heading">
            <div><span className="bending-eyebrow">Return Document</span><h2>Return Against Dispatch {selectedDispatch.dispatchNumber}</h2></div>
            {returnLinesQuery.isFetching && !returnLinesQuery.isPending ? <span className="bending-refreshing">Refreshing dispatch…</span> : null}
          </div>
          <dl className="bending-document-details">
            <div><dt>Dispatch Date</dt><dd>{selectedDispatch.dispatchDate}</dd></div>
            <div><dt>Destination</dt><dd>{selectedDispatch.destination ?? '—'}</dd></div>
            <div><dt>Sheet Number</dt><dd>{selectedDispatch.sheetNumber ?? '—'}</dd></div>
            {returnLinesQuery.data ? <div><dt>Status</dt><dd>{getDispatchStatus(returnLinesQuery.data)}</dd></div> : null}
          </dl>
          {returnLinesQuery.isPending ? <p className="bending-loading"><LoadingSpinner label="Loading dispatch materials" /> Loading dispatch materials…</p> : null}
          {returnLinesQuery.isError ? (
            <p className="bending-feedback bending-feedback--error" role="alert">
              Dispatch materials could not be loaded.
              <Button type="button" variant="secondary" onClick={() => void returnLinesQuery.refetch()}>Retry</Button>
            </p>
          ) : null}
          {returnLinesQuery.isSuccess && !hasOutstandingItems ? <p className="bending-empty bending-empty--page">This Dispatch has been fully returned.</p> : null}
          {returnLinesQuery.isSuccess && hasOutstandingItems ? (
            <>
              <BendingReturnHeaderFields
                isDisabled={createReturnMutation.isPending}
                values={headerValues}
                onChange={updateHeader}
              />
              <section className="bending-section" aria-labelledby="bending-outstanding-materials">
                <div className="bending-section__heading">
                  <div><span>Step 2</span><h3 id="bending-outstanding-materials">Outstanding Materials</h3></div>
                  <p>Return quantities cannot exceed the remaining quantity sent on the selected dispatch.</p>
                </div>
                <BendingReturnItemsTable
                  isDisabled={createReturnMutation.isPending}
                  items={returnableItems}
                  onQuantityChange={draft.updateQuantity}
                />
              </section>
              <div className="bending-dispatch__footer">
                <BendingReturnSummary items={draft.items} />
                <div className="bending-dispatch__submit">
                  {submitError ? <p className="bending-submit-error" role="alert">{submitError}</p> : null}
                  <Button disabled={!canSubmit} isLoading={createReturnMutation.isPending} type="submit">
                    {createReturnMutation.isPending ? 'Creating Return…' : 'Create Bending Return'}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </form>
      ) : null}
    </div>
  )
}
