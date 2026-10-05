import { useState } from 'react'

import { SavedFileActions } from '../../../components/shared/SavedFileActions'
import { Button } from '../../../components/ui/Button'
import { AppNotification } from '../../../components/ui/AppNotification'
import { downloadStoredPdf } from '../../../services/files/pdfFiles'
import { documentStorage } from '../../../services/supabase/documentStorage'

interface DocumentPdfActionsProps {
  pdfPath: string
  reference: string
}

export function DocumentPdfActions({ pdfPath, reference }: DocumentPdfActionsProps) {
  const [action, setAction] = useState<'download' | 'open' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedPath, setSavedPath] = useState<string | null>(null)

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
      const result = await downloadStoredPdf(pdfPath, `${reference}.pdf`)
      if (result.status === 'saved') setSavedPath(result.path)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'The PDF could not be downloaded.')
    } finally {
      setAction(null)
    }
  }

  return (
    <div className="document-pdf-actions">
      {error ? (
        <AppNotification onDismiss={() => setError(null)} title="PDF action failed" tone="error">
          <span>{error}</span>
        </AppNotification>
      ) : null}
      {savedPath ? (
        <AppNotification onDismiss={() => setSavedPath(null)} title="PDF saved">
          <SavedFileActions path={savedPath} />
        </AppNotification>
      ) : null}
      <div>
        <Button isLoading={action === 'open'} type="button" variant="secondary" onClick={() => void openPdf()}>Open PDF</Button>
        <Button isLoading={action === 'download'} type="button" variant="secondary" onClick={() => void downloadPdf()}>Download PDF</Button>
      </div>
    </div>
  )
}
