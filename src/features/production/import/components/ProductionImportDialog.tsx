import { useState } from 'react'

import { Button } from '../../../../components/ui/Button'
import { Dialog } from '../../../../components/ui/Dialog'
import { ImportFileStep } from './ImportFileStep'
import { ImportPreview } from './ImportPreview'
import { ImportResult } from './ImportResult'
import { useProductionImport } from '../hooks/useProductionImport'
import type { ProductionImportPayloadRow, ProductionImportResult } from '../types'

interface ProductionImportDialogProps {
  destination: string
  isOpen: boolean
  onClose: () => void
  onImport: (fileName: string, rows: ProductionImportPayloadRow[]) => Promise<ProductionImportResult>
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : 'The workbook could not be imported. Please try again.'
}

export function ProductionImportDialog({ destination, isOpen, onClose, onImport }: ProductionImportDialogProps) {
  const productionImport = useProductionImport()
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [result, setResult] = useState<ProductionImportResult | null>(null)

  const closeDialog = () => {
    if (isImporting || productionImport.isParsing) {
      return
    }
    productionImport.reset()
    setImportError(null)
    setResult(null)
    onClose()
  }

  const importWorkbook = async () => {
    const { fileName, preview } = productionImport
    if (!fileName || !preview?.payload) {
      return
    }

    setImportError(null)
    setIsImporting(true)
    try {
      setResult(await onImport(fileName, preview.payload))
    } catch (error) {
      setImportError(messageFromError(error))
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog
      className="dialog--production-import"
      isCloseDisabled={isImporting || productionImport.isParsing}
      isOpen={isOpen}
      onClose={closeDialog}
      title="Import Production Excel"
    >
      {result ? (
        <div className="production-import-dialog">
          <ImportResult result={result} />
          <div className="entity-form__actions">
            <Button type="button" onClick={closeDialog}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="production-import-dialog">
          <p className="production-import-destination">
            <span>Import into</span>
            <strong>{destination}</strong>
          </p>
          <ImportFileStep
            error={productionImport.error}
            fileName={productionImport.fileName}
            isDisabled={isImporting || productionImport.isParsing}
            isParsing={productionImport.isParsing}
            onFileSelect={productionImport.selectFile}
            onSheetSelect={productionImport.selectSheet}
            sheetName={productionImport.sheetName}
            sheetNames={productionImport.sheetNames}
          />
          {productionImport.preview ? <ImportPreview preview={productionImport.preview} /> : null}
          {importError ? <p className="form-error production-import-failure" role="alert">{importError}</p> : null}
          <div className="entity-form__actions">
            <Button type="button" variant="secondary" disabled={isImporting} onClick={closeDialog}>Cancel</Button>
            <Button
              type="button"
              disabled={!productionImport.preview?.payload?.length}
              isLoading={isImporting}
              onClick={() => void importWorkbook()}
            >
              {isImporting
                ? 'Importing…'
                : productionImport.preview?.errorRows
                  ? `Fix ${productionImport.preview.errorRows} Invalid ${productionImport.preview.errorRows === 1 ? 'Row' : 'Rows'} to Import`
                  : `Import ${productionImport.preview?.validRows ?? 0} Rows`}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
