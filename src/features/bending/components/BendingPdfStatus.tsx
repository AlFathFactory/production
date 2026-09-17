import { useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { documentStorage } from '../../../services/supabase/documentStorage'
import type { BendingPdfAttachmentState } from '../hooks/useBendingPdfAttachment'

interface BendingPdfStatusProps {
  onRetry: () => void
  state: BendingPdfAttachmentState
}

export function BendingPdfStatus({ onRetry, state }: BendingPdfStatusProps) {
  const [action, setAction] = useState<'download' | 'open' | null>(null)
  const [accessError, setAccessError] = useState<string | null>(null)

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
      await documentStorage.downloadDocument(state.path, `${state.target.kind}_${state.target.reference}`)
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : 'The PDF could not be downloaded.')
    } finally {
      setAction(null)
    }
  }

  return (
    <div className="bending-pdf-status">
      <strong>PDF attached</strong>
      <div className="bending-pdf-status__actions">
        <Button isLoading={action === 'open'} type="button" variant="secondary" onClick={() => void openPdf()}>Open PDF</Button>
        <Button isLoading={action === 'download'} type="button" variant="secondary" onClick={() => void downloadPdf()}>Download PDF</Button>
      </div>
      {accessError ? <span className="bending-pdf-status__error" role="alert">{accessError}</span> : null}
    </div>
  )
}
