import { useState } from 'react'

import { SavedFileActions } from '../../../components/shared/SavedFileActions'
import { Button } from '../../../components/ui/Button'
import { downloadStoredPdf } from '../../../services/files/pdfFiles'
import { documentStorage } from '../../../services/supabase/documentStorage'
import type { BendingPdfAttachmentState } from '../hooks/useBendingPdfAttachment'

interface BendingPdfStatusProps {
  onRetry: () => void
  state: BendingPdfAttachmentState
}

export function BendingPdfStatus({ onRetry, state }: BendingPdfStatusProps) {
  const [action, setAction] = useState<'download' | 'open' | null>(null)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [savedPath, setSavedPath] = useState<string | null>(null)

  if (state.status === 'idle') return null
  if (state.status === 'attaching') {
    return <div className="bending-pdf-status" role="status">Generating and attaching PDF...</div>
  }
  if (state.status === 'failed') {
    return (
      <div className="bending-pdf-status bending-pdf-status--error" role="alert">
        <span><strong>PDF attachment failed.</strong> {state.error}</span>
        <Button type="button" variant="secondary" onClick={onRetry}>Retry PDF</Button>
      </div>
    )
  }

  const openPdf = async () => {
    setAccessError(null)
    setAction('open')
    const pdfWindow = window.open('about:blank', '_blank')
    if (!pdfWindow) {
      setAccessError('Your browser blocked the PDF window. Allow pop-ups for this site and retry.')
      setAction(null)
      return
    }
    pdfWindow.opener = null
    try {
      const signedUrl = await documentStorage.createSignedUrl(state.path)
      pdfWindow.location.replace(signedUrl)
    } catch (error) {
      pdfWindow.close()
      setAccessError(error instanceof Error ? error.message : 'The PDF could not be opened.')
    } finally {
      setAction(null)
    }
  }

  const downloadPdf = async () => {
    setAccessError(null)
    setAction('download')
    try {
      const result = await downloadStoredPdf(state.path, `${state.target.kind}_${state.target.reference}.pdf`)
      if (result.status === 'saved') setSavedPath(result.path)
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : 'The PDF could not be downloaded.')
    } finally {
      setAction(null)
    }
  }

  const automaticSavedPath = state.localSave?.status === 'saved' ? state.localSave.path : null

  return (
    <div className="bending-pdf-status">
      <strong>{state.localSave?.status === 'saving' ? 'PDF attached · Choose where to save it' : 'PDF attached'}</strong>
      <div className="bending-pdf-status__actions">
        <Button isLoading={action === 'open'} type="button" variant="secondary" onClick={() => void openPdf()}>Open PDF</Button>
        <Button isLoading={action === 'download'} type="button" variant="secondary" onClick={() => void downloadPdf()}>Download PDF</Button>
      </div>
      {automaticSavedPath || savedPath ? <SavedFileActions path={savedPath ?? automaticSavedPath!} /> : null}
      {state.localSave?.status === 'failed' ? (
        <span className="bending-pdf-status__error" role="alert">
          PDF attached, but the local copy was not saved. {state.localSave.error}
        </span>
      ) : null}
      {accessError ? <span className="bending-pdf-status__error" role="alert">{accessError}</span> : null}
    </div>
  )
}
