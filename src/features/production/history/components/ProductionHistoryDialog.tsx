import { useEffect, useState } from 'react'
import type { AppRole } from '../../../auth/types'
import { Dialog } from '../../../../components/ui/Dialog'
import { AppNotification } from '../../../../components/ui/AppNotification'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'
import { useProductionHistory, useProductionAudit } from '../queries/productionHistoryQueries'
import { useCorrectProductionStageEntry, useDeleteProductionStageEntry } from '../mutations/useProductionHistoryMutations'
import { CorrectionDialog } from './CorrectionDialog'
import { DeleteEntryDialog } from './DeleteEntryDialog'
import { ProductionHistoryTable } from './ProductionHistoryTable'
import type { ProductionStageEntry } from '../types'

interface ProductionHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  productionItemId: string | null
  itemArticle: string
  itemDesignation: string | null
  userRole: AppRole | null
}

export function ProductionHistoryDialog({ isOpen, onClose, productionItemId, itemArticle, itemDesignation, userRole }: ProductionHistoryDialogProps) {
  const filters = { productionItemId: productionItemId ?? '' }

  const historyQuery = useProductionHistory(filters)
  const auditQuery = useProductionAudit(filters)
  const correctMutation = useCorrectProductionStageEntry(filters.productionItemId)
  const deleteMutation = useDeleteProductionStageEntry(filters.productionItemId)

  const [correctDialogEntry, setCorrectDialogEntry] = useState<ProductionStageEntry | null>(null)
  const [correctDialogError, setCorrectDialogError] = useState<string | null>(null)
  const [deleteDialogEntry, setDeleteDialogEntry] = useState<ProductionStageEntry | null>(null)
  const [deleteDialogError, setDeleteDialogError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) setSuccessMessage(null)
  }, [isOpen])

  function openCorrectDialog(entry: ProductionStageEntry) {
    if (entry.source === 'document') return
    setCorrectDialogError(null)
    setCorrectDialogEntry(entry)
  }

  function openDeleteDialog(entry: ProductionStageEntry) {
    if (entry.source === 'document') return
    setDeleteDialogError(null)
    setDeleteDialogEntry(entry)
  }

  function closeCorrectDialog() {
    setCorrectDialogEntry(null)
    setCorrectDialogError(null)
    correctMutation.reset()
  }

  function closeDeleteDialog() {
    setDeleteDialogEntry(null)
    setDeleteDialogError(null)
    deleteMutation.reset()
  }

  async function handleCorrect(input: { quantity: number; entryDate: string; note: string; reason: string }) {
    if (!correctDialogEntry) return
    try {
      await correctMutation.mutateAsync({ entryId: correctDialogEntry.id, ...input })
      closeCorrectDialog()
      setSuccessMessage('Production entry corrected successfully.')
    } catch (error) {
      setCorrectDialogError(error instanceof Error ? error.message : 'Failed to correct entry.')
    }
  }

  async function handleDelete(reason: string) {
    if (!deleteDialogEntry) return
    try {
      await deleteMutation.mutateAsync({ entryId: deleteDialogEntry.id, reason })
      closeDeleteDialog()
      setSuccessMessage('Production entry deleted successfully.')
    } catch (error) {
      setDeleteDialogError(error instanceof Error ? error.message : 'Failed to delete entry.')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {successMessage ? (
        <AppNotification
          key={successMessage}
          autoDismissMs={5000}
          onDismiss={() => setSuccessMessage(null)}
          title="Action completed"
        >
          <span>{successMessage}</span>
        </AppNotification>
      ) : null}
      <Dialog
        title="Production History"
        onClose={onClose}
        isOpen={isOpen}
        isCloseDisabled={historyQuery.isPending || auditQuery.isPending || correctMutation.isPending || deleteMutation.isPending}
        className="dialog--production-history"
      >
      <div className="production-history-dialog-header">
        <strong>{itemArticle}</strong>
        {itemDesignation ? <span> — {itemDesignation}</span> : null}
      </div>

      {historyQuery.isPending || auditQuery.isPending ? (
        <div className="production-history-dialog__loading">
          <LoadingSpinner label="Loading history" /> Loading history…
        </div>
      ) : historyQuery.isError ? (
        <div className="production-history-dialog__error" role="alert">
          <p>{historyQuery.error.message}</p>
          <button type="button" className="button button--secondary" onClick={() => void historyQuery.refetch()}>Retry</button>
        </div>
      ) : auditQuery.isError ? (
        <div className="production-history-dialog__error" role="alert">
          <p>{auditQuery.error.message}</p>
          <button type="button" className="button button--secondary" onClick={() => void auditQuery.refetch()}>Retry</button>
        </div>
      ) : (
        <ProductionHistoryTable
          history={historyQuery.data ?? []}
          audit={auditQuery.data ?? []}
          userRole={userRole}
          onCorrect={openCorrectDialog}
          onDelete={openDeleteDialog}
        />
      )}

      <CorrectionDialog
        isOpen={Boolean(correctDialogEntry)}
        onClose={closeCorrectDialog}
        onSubmit={handleCorrect}
        entry={correctDialogEntry}
        isSaving={correctMutation.isPending}
        error={correctDialogError ?? correctMutation.error?.message ?? null}
      />
      <DeleteEntryDialog
        isOpen={Boolean(deleteDialogEntry)}
        onClose={closeDeleteDialog}
        onSubmit={handleDelete}
        entry={deleteDialogEntry}
        isDeleting={deleteMutation.isPending}
        error={deleteDialogError ?? deleteMutation.error?.message ?? null}
      />
      </Dialog>
    </>
  )
}
