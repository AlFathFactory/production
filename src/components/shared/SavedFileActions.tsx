import { useState } from 'react'

import { revealSavedFile } from '../../services/files/pdfFiles'
import { Button } from '../ui/Button'

interface SavedFileActionsProps {
  path: string
}

export function SavedFileActions({ path }: SavedFileActionsProps) {
  const [isRevealing, setIsRevealing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const revealFile = async () => {
    setError(null)
    setIsRevealing(true)
    try {
      await revealSavedFile(path)
    } catch (revealError) {
      setError(revealError instanceof Error ? revealError.message : 'The saved file could not be shown.')
    } finally {
      setIsRevealing(false)
    }
  }

  return (
    <div className="saved-file-actions">
      <span>Saved successfully</span>
      <Button isLoading={isRevealing} type="button" variant="secondary" onClick={() => void revealFile()}>
        Open Folder
      </Button>
      {error ? <span className="saved-file-actions__error" role="alert">{error}</span> : null}
    </div>
  )
}
