import { useState } from 'react'

import '../ProductionImport.css'
import { Button } from '../../../../components/ui/Button'
import { Dialog } from '../../../../components/ui/Dialog'
import { ColumnMappingStep } from './ColumnMappingStep'
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
  const [step, setStep] = useState<'mapping' | 'preview'>('mapping')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [result, setResult] = useState<ProductionImportResult | null>(null)

  const closeDialog = () => {
    if (isImporting || productionImport.isParsing) {
      return
    }
    productionImport.reset()
    setStep('mapping')
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

  const continueToPreview = () => {
    if (productionImport.createPreview()) {
      setImportError(null)
      setStep('preview')
    }
  }

  return (
    <Dialog
      className="dialog--wide dialog--production-import"
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
          <ol className="production-import-steps" aria-label="Import progress">
            <li className={step === 'mapping' ? 'is-current' : 'is-complete'}>Upload &amp; Mapping</li>
            <li className={step === 'preview' ? 'is-current' : ''}>Preview &amp; Validation</li>
            <li>Import</li>
          </ol>

          {step === 'mapping' ? (
            <>
              <ImportFileStep
                error={productionImport.sourceColumns.length === 0 ? productionImport.error : null}
                fileName={productionImport.fileName}
                isDisabled={isImporting || productionImport.isParsing}
                isParsing={productionImport.isParsing}
                onFileSelect={productionImport.selectFile}
                onSheetSelect={productionImport.selectSheet}
                sheetName={productionImport.sheetName}
                sheetNames={productionImport.sheetNames}
              />
              {productionImport.headerRow !== null ? (
                <ColumnMappingStep
                  headerRow={productionImport.headerRow}
                  headerRowOptions={productionImport.headerRowOptions}
                  mapping={productionImport.mapping}
                  missingRequiredFields={productionImport.missingRequiredFields}
                  onHeaderRowChange={productionImport.selectHeaderRow}
                  onMappingChange={productionImport.mapColumn}
                  sourceColumns={productionImport.sourceColumns}
                />
              ) : null}
            </>
          ) : productionImport.preview ? <ImportPreview preview={productionImport.preview} /> : null}
          {productionImport.error && productionImport.sourceColumns.length > 0 ? <p className="form-error" role="alert">{productionImport.error}</p> : null}
          {importError ? <p className="form-error production-import-failure" role="alert">{importError}</p> : null}
          <div className="entity-form__actions">
            {step === 'mapping' ? (
              <>
                <Button type="button" variant="secondary" onClick={closeDialog}>Cancel</Button>
                <Button
                  type="button"
                  disabled={productionImport.sourceColumns.length === 0 || productionImport.missingRequiredFields.length > 0}
                  onClick={continueToPreview}
                >
                  Review Preview
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="secondary" disabled={isImporting} onClick={() => setStep('mapping')}>Back to Mapping</Button>
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
              </>
            )}
          </div>
        </div>
      )}
    </Dialog>
  )
}
