import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AppNotification } from '../../../components/ui/AppNotification'
import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { formatQuantity, getCurrentDateInputValue } from '../../production/utils'
import { useBendingReturnDraft } from '../hooks/useBendingReturnDraft'
import { useBendingPdfAttachment } from '../hooks/useBendingPdfAttachment'
import { useCreateBendingReturn } from '../mutations/useCreateBendingReturn'
import { useBendingDestinationInventory, useBendingDestinationSummaries } from '../queries/bendingQueries'
import { calculateReturnSummary } from '../returnValidation'
import type { BendingReturnHeaderValues, BendingReturnSuccess } from '../types'
import { BendingDestinationSelect } from './BendingDestinationSelect'
import { BendingDestinationSummary } from './BendingDestinationSummary'
import { BendingPdfStatus } from './BendingPdfStatus'
import { BendingReturnHeaderFields } from './BendingReturnHeaderFields'
import { BendingReturnItemsTable } from './BendingReturnItemsTable'
import { BendingReturnSummary } from './BendingReturnSummary'

function initialHeaderValues(): BendingReturnHeaderValues {
  return { receivedByName: '', returnDate: getCurrentDateInputValue() }
}

export function BendingReturnWorkflow() {
  const [searchParams, setSearchParams] = useSearchParams()
  const targetedDestinationId = searchParams.get('destinationId')
  const targetedDispatchItemId = searchParams.get('dispatchItemId')
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(targetedDestinationId)
  const [headerValues, setHeaderValues] = useState(initialHeaderValues)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<BendingReturnSuccess | null>(null)
  const summariesQuery = useBendingDestinationSummaries()
  const inventoryQuery = useBendingDestinationInventory(selectedDestinationId)
  const draft = useBendingReturnDraft()
  const pdfAttachment = useBendingPdfAttachment()
  const createReturnMutation = useCreateBendingReturn()
  const selectedSummary = summariesQuery.data?.find((summary) => summary.destinationId === selectedDestinationId) ?? null
  const selectedDispatchId = draft.selectedItems[0]?.dispatchId ?? null
  const selectedDispatchNumber = draft.selectedItems[0]?.dispatchNumber ?? null
  const targetedInventoryLine = targetedDispatchItemId
    ? inventoryQuery.data?.find((item) => item.dispatchItemId === targetedDispatchItemId) ?? null
    : null
  const displayedItems = targetedDispatchItemId
    ? draft.items.filter((item) => item.dispatchItemId === targetedDispatchItemId)
    : draft.items
  const hasDisplayableInventory = targetedDispatchItemId
    ? Boolean(targetedInventoryLine)
    : Boolean(inventoryQuery.data?.length)
  const canSubmit = Boolean(
    selectedDispatchId
    && headerValues.returnDate
    && draft.isValid
    && !createReturnMutation.isPending,
  )

  useEffect(() => {
    if (inventoryQuery.data) {
      draft.syncLines(inventoryQuery.data, targetedDispatchItemId)
    }
  }, [draft.syncLines, inventoryQuery.data, targetedDispatchItemId])

  useEffect(() => {
    if (!targetedDestinationId || targetedDestinationId === selectedDestinationId) return
    setSelectedDestinationId(targetedDestinationId)
    draft.clear()
    setHeaderValues(initialHeaderValues())
    setSubmitError(null)
    setSuccess(null)
  }, [draft.clear, selectedDestinationId, targetedDestinationId])

  const selectDestination = (destinationId: string | null) => {
    setSearchParams({}, { replace: true })
    setSelectedDestinationId(destinationId)
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
    if (!canSubmit || !selectedDispatchId) return

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
      })
      setSuccess({
        itemCount: submittedItems.length,
        returnReference: result.return_reference,
        totalQuantity: summary.totalQuantity,
      })
      void pdfAttachment.attach({
        id: result.id,
        kind: 'return',
        pdfPath: result.pdf_path,
        reference: result.return_reference,
      })
      draft.clear()
      setHeaderValues(initialHeaderValues())
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The Bending Return could not be created. Please try again.')
    }
  }

  const destinationOptions = (summariesQuery.data ?? []).map((summary) => ({
    id: summary.destinationId,
    label: `${summary.destinationName} · ${summary.outstandingItemCount} open items · ${formatQuantity(summary.outstandingQuantity)} qty outstanding`,
  }))

  return (
    <div aria-labelledby="bending-return-tab" className="bending-return-workflow" id="bending-return-panel" role="tabpanel">
      {success ? (
        <AppNotification onDismiss={() => setSuccess(null)} title={`Bending Return ${success.returnReference} created successfully`}>
          <span className="app-notification__meta">Items: {success.itemCount} · Total quantity: {formatQuantity(success.totalQuantity)}</span>
          <BendingPdfStatus state={pdfAttachment.state} onRetry={pdfAttachment.retry} />
        </AppNotification>
      ) : null}

      <section className="bending-return-selector" aria-labelledby="bending-destination-selector-heading">
        <div className="bending-section__heading">
          <div><span>Filter</span><h2 id="bending-destination-selector-heading">Destination</h2></div>
          <p>All outstanding issued items are shown by default. Select a Destination to narrow the list.</p>
        </div>
        {summariesQuery.isPending ? <p className="bending-loading"><LoadingSpinner label="Loading Destinations" /> Loading Destinations…</p> : null}
        {summariesQuery.isError ? (
          <p className="bending-feedback bending-feedback--error" role="alert">
            Destinations could not be loaded.
            <Button type="button" variant="secondary" onClick={() => void summariesQuery.refetch()}>Retry</Button>
          </p>
        ) : null}
        {summariesQuery.isSuccess ? (
          <BendingDestinationSelect
            id="bending-return-destination"
            isDisabled={createReturnMutation.isPending}
            label="Destination filter"
            onChange={selectDestination}
            options={destinationOptions}
            selectedDestinationId={selectedDestinationId}
          />
        ) : null}
        {summariesQuery.isFetching && !summariesQuery.isPending ? <span className="bending-refreshing">Refreshing Destinations…</span> : null}
      </section>

      <form className="bending-dispatch bending-return" onSubmit={(event) => void createReturn(event)}>
          <div className="bending-dispatch__heading">
            <div><span className="bending-eyebrow">Outstanding Issued Items</span><h2>{selectedSummary?.destinationName ?? 'All Destinations'}</h2></div>
            {inventoryQuery.isFetching && !inventoryQuery.isPending ? <span className="bending-refreshing">Refreshing inventory…</span> : null}
          </div>
          {selectedSummary ? <BendingDestinationSummary summary={selectedSummary} /> : null}
          {inventoryQuery.isPending ? <p className="bending-loading bending-loading--section"><LoadingSpinner label="Loading issued items" /> Loading issued items…</p> : null}
          {inventoryQuery.isError ? (
            <p className="bending-feedback bending-feedback--error bending-feedback--section" role="alert">
              Issued items could not be loaded.
              <Button type="button" variant="secondary" onClick={() => void inventoryQuery.refetch()}>Retry</Button>
            </p>
          ) : null}
          {inventoryQuery.isSuccess && !hasDisplayableInventory ? (
            <div className="bending-empty bending-empty--page">
              <p>
                {targetedDispatchItemId
                  ? 'This item is no longer outstanding at this Destination.'
                  : 'No outstanding issued items match this Destination filter.'}
              </p>
              {targetedDispatchItemId ? (
                <Button type="button" variant="secondary" onClick={() => setSearchParams({}, { replace: true })}>
                  Show Destination Items
                </Button>
              ) : null}
            </div>
          ) : null}
          {inventoryQuery.isSuccess && hasDisplayableInventory ? (
            <>
              <BendingReturnHeaderFields isDisabled={createReturnMutation.isPending} values={headerValues} onChange={updateHeader} />
              <section className="bending-section" aria-labelledby="bending-outstanding-materials">
                <div className="bending-section__heading">
                  <div><span>Step 1</span><h3 id="bending-outstanding-materials">Outstanding Materials</h3></div>
                  <p>One Receive Packing document can contain items from one Issue Packing dispatch.</p>
                </div>
                {selectedDispatchNumber ? <p className="bending-dispatch-lock">Current Issue Packing dispatch: <strong>{selectedDispatchNumber}</strong></p> : null}
                <BendingReturnItemsTable
                  isDisabled={createReturnMutation.isPending}
                  items={displayedItems}
                  onQuantityChange={draft.updateQuantity}
                  onToggle={draft.toggleItem}
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
    </div>
  )
}
