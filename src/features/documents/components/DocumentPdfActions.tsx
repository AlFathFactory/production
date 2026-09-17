import { useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { documentStorage } from '../../../services/supabase/documentStorage'

interface DocumentPdfActionsProps {
  pdfPath: string
  reference: string
}

export function DocumentPdfActions({ pdfPath, reference }: DocumentPdfActionsProps) {
  const [action, setAction] = useState<'download' | 'open' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openPdf = async () => {
    setError(null)
    setAction('open')
    const pdfWindow = window.open('about:blank', '_blank')
    if (!pdfWindow) {
      setError('Your browser blocked the PDF window. Allow pop-ups for this site and retry.')
      setAction(null)
      return
    }
    pdfWindow.opener = null

    try {
      pdfWindow.location.replace(await documentStorage.createSignedUrl(pdfPath))
    } catch (actionError) {
      pdfWindow.close()
      setError(actionError instanceof Error ? actionError.message : 'The PDF could not be opened.')
    } finally {
      setAction(null)
    }
  }

  const downloadPdf = async () => {
    setError(null)
    setAction('download')
    try {
      await documentStorage.downloadDocument(pdfPath, reference)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'The PDF could not be downloaded.')
    } finally {
      setAction(null)
    }
  }

  return (
    <div className="document-pdf-actions">
      <div>
        <Button isLoading={action === 'open'} type="button" variant="secondary" onClick={() => void openPdf()}>Open PDF</Button>
        <Button isLoading={action === 'download'} type="button" variant="secondary" onClick={() => void downloadPdf()}>Download PDF</Button>
      </div>
      {error ? <span role="alert">{error}</span> : null}
    </div>
  )
}
