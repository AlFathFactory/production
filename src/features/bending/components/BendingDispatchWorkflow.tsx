import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { useProductionItems } from '../../production/queries/productionQueries'
import type { ProductionFilters } from '../../production/types'
import { formatQuantity, getCurrentDateInputValue } from '../../production/utils'
import { calculateDispatchSummary } from '../dispatchValidation'
import { useBendingDispatchDraft } from '../hooks/useBendingDispatchDraft'
import { useBendingPdfAttachment } from '../hooks/useBendingPdfAttachment'
import { useCreateBendingDispatch } from '../mutations/useCreateBendingDispatch'
import type { BendingDispatchHeaderValues, BendingDispatchSuccess } from '../types'
import { BendingDispatchHeaderFields } from './BendingDispatchHeaderFields'
import { BendingDispatchItemsTable } from './BendingDispatchItemsTable'
import { BendingDispatchSummary } from './BendingDispatchSummary'
import { BendingEligibleItemsTable } from './BendingEligibleItemsTable'
import { BendingPdfStatus } from './BendingPdfStatus'

interface BendingDispatchWorkflowProps {
  lotId: string
  projectId: string | null
  projectNumberId: string | null
}

function initialHeaderValues(): BendingDispatchHeaderValues {
  return {
    approvalName: '',
    destination: '',
    dispatchDate: getCurrentDateInputValue(),
    dispatchName: '',
    dispatchNumber: '',
    followName: '',
    sheetNumber: '',
  }
}

export function BendingDispatchWorkflow({ lotId, projectId, projectNumberId }: BendingDispatchWorkflowProps) {
  const [headerValues, setHeaderValues] = useState(initialHeaderValues)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<BendingDispatchSuccess | null>(null)
  const draft = useBendingDispatchDraft()
  const pdfAttachment = useBendingPdfAttachment()
  const createDispatchMutation = useCreateBendingDispatch()
  const searchFilters: ProductionFilters = {
    lotId,
    nextAction: null,
    progressState: null,
    projectId,
    projectNumberId,
    query: '',
    route: 'BEND',
  }
  const eligibleQuery = useProductionItems(searchFilters)
  const eligibleItems = (eligibleQuery.data ?? []).filter((item) => (
    item.production_item_id !== null
    && item.article !== null
    && (item.remaining_out_bend ?? 0) > 0
  ))
  const selectedItemIds = new Set(draft.items.map((item) => item.productionItemId))
  const canSubmit = Boolean(
    headerValues.dispatchNumber.trim()
    && headerValues.dispatchDate
    && draft.isValid
    && !createDispatchMutation.isPending,
  )

  useEffect(() => {
    if (eligibleQuery.data) {
      draft.syncAvailability(eligibleQuery.data)
    }
  }, [draft.syncAvailability, eligibleQuery.data])

  const updateHeader = (field: keyof BendingDispatchHeaderValues, value: string) => {
    setHeaderValues((current) => ({ ...current, [field]: value }))
    setSubmitError(null)
    setSuccess(null)
  }

  const createDispatch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    const summary = calculateDispatchSummary(draft.items)
    const submittedItems = draft.items.map((item) => ({
      production_item_id: item.productionItemId,
      quantity: item.quantity,
    }))

    setSubmitError(null)
    setSuccess(null)
    try {
      const result = await createDispatchMutation.mutateAsync({ ...headerValues, items: submittedItems, lotId })
      setSuccess({
        dispatchNumber: result.dispatch_number,
        itemCount: submittedItems.length,
        totalQuantity: summary.totalQuantity,
      })
      void pdfAttachment.attach({
        id: result.id,
        kind: 'dispatch',
        pdfPath: result.pdf_path,
        reference: result.dispatch_number,
      })
      draft.clear()
      setHeaderValues(initialHeaderValues())
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The Bending Dispatch could not be created. Please try again.')
    }
  }

  return (
    <div aria-labelledby="bending-dispatch-tab" className="bending-dispatch-workflow" id="bending-dispatch-panel" role="tabpanel">
      {success ? (
        <div className="bending-document-success">
          <p className="bending-feedback bending-feedback--success" role="status">
            Bending dispatch created successfully. <strong>Dispatch: {success.dispatchNumber}</strong>
            <span>Items: {success.itemCount} · Total quantity: {formatQuantity(success.totalQuantity)}</span>
          </p>
          <BendingPdfStatus state={pdfAttachment.state} onRetry={pdfAttachment.retry} />
        </div>
      ) : null}
      <form className="bending-dispatch" onSubmit={(event) => void createDispatch(event)}>
        <div className="bending-dispatch__heading">
          <div><span className="bending-eyebrow">Packing List</span><h2>Create Bending Dispatch</h2></div>
          {eligibleQuery.isFetching && !eligibleQuery.isPending ? <span className="bending-refreshing">Refreshing availability…</span> : null}
        </div>
        <BendingDispatchHeaderFields isDisabled={createDispatchMutation.isPending} values={headerValues} onChange={updateHeader} />
        <section className="bending-section" aria-labelledby="eligible-bending-materials">
          <div className="bending-section__heading">
            <div><span>Step 1</span><h3 id="eligible-bending-materials">Eligible BEND Materials</h3></div>
            <p>Availability is calculated from Production CUT and OUT_BEND totals.</p>
          </div>
          {eligibleQuery.isPending ? <p className="bending-loading"><LoadingSpinner label="Loading eligible BEND materials" /> Loading eligible materials…</p> : null}
          {eligibleQuery.isError ? (
            <p className="bending-feedback bending-feedback--error" role="alert">
              Eligible materials could not be loaded.
              <Button type="button" variant="secondary" onClick={() => void eligibleQuery.refetch()}>Retry</Button>
            </p>
          ) : null}
          {eligibleQuery.isSuccess ? (
            <BendingEligibleItemsTable
              isDisabled={createDispatchMutation.isPending}
              items={eligibleItems}
              selectedItemIds={selectedItemIds}
              onAdd={draft.addItem}
            />
          ) : null}
        </section>
        <section className="bending-section" aria-labelledby="selected-bending-materials">
          <div className="bending-section__heading">
            <div><span>Step 2</span><h3 id="selected-bending-materials">Selected Dispatch Items</h3></div>
            <p>Enter the quantity being sent for each material.</p>
          </div>
          <BendingDispatchItemsTable
            isDisabled={createDispatchMutation.isPending}
            items={draft.items}
            onQuantityChange={draft.updateQuantity}
            onRemove={draft.removeItem}
          />
        </section>
        <div className="bending-dispatch__footer">
          <BendingDispatchSummary items={draft.items} />
          <div className="bending-dispatch__submit">
            {submitError ? <p className="bending-submit-error" role="alert">{submitError}</p> : null}
            <Button disabled={!canSubmit} isLoading={createDispatchMutation.isPending} type="submit">
              {createDispatchMutation.isPending ? 'Creating Dispatch…' : 'Create Bending Dispatch'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
