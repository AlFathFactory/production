import { useState } from 'react'

import '../ProductionImport.css'
import { Button } from '../../../../components/ui/Button'
import { Dialog } from '../../../../components/ui/Dialog'
import { useProductionImport } from '../hooks/useProductionImport'
import type { ProductionImportPayloadRow, ProductionImportResult } from '../types'
import { ColumnMappingStep } from './ColumnMappingStep'
import { ImportFileStep } from './ImportFileStep'
import { ImportPreview } from './ImportPreview'
import { ImportResult } from './ImportResult'

interface ProductionImportDialogProps {
  destination: string
  isOpen: boolean
  lotId: string | null
  onClose: () => void
  onImport: (fileName: string, rows: ProductionImportPayloadRow[]) => Promise<ProductionImportResult>
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : 'The workbook could not be imported. Please try again.'
}

function csvCell(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function buildErrorReportCsv(preview: NonNullable<ReturnType<typeof useProductionImport>['preview']>): string {
  const header = [
    'Excel Row', 'Article', 'Routing', 'Error Code', 'Problem',
    'Total Qty', 'CUT Qty', 'OUT Bend Qty', 'BEND Qty', 'ROLLING Qty', 'Dispensed Qty',
  ]
  const lines = [header.map(csvCell).join(',')]
  for (const { row, errors } of preview.rows) {
    if (errors.length === 0) continue
    for (const error of errors) {
      lines.push([
        row.source_row,
        row.article || '',
        row.routing,
        error.code ?? '',
        error.message,
        row.total_quantity ?? '',
        row.cut_qty ?? '',
        row.out_bend_qty ?? '',
        row.bend_qty ?? '',
        row.rolling_qty ?? '',
        row.dispensed_qty ?? '',
      ].map(csvCell).join(','))
    }
  }
  return lines.join('\r\n')
}

export function ProductionImportDialog({ destination, isOpen, lotId, onClose, onImport }: ProductionImportDialogProps) {
  const productionImport = useProductionImport(lotId ?? '')
  const [step, setStep] = useState<'mapping' | 'preview'>('mapping')
  const [isImporting, setIsImporting] = useState(false)
  const [isRevalidating, setIsRevalidating] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [result, setResult] = useState<ProductionImportResult | null>(null)

  const closeDialog = () => {
    if (isImporting || productionImport.isParsing || isRevalidating) {
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

  const revalidateWorkbook = async () => {
    setImportError(null)
    setIsRevalidating(true)
    try {
      await productionImport.revalidate()
    } finally {
      setIsRevalidating(false)
    }
  }

  const downloadErrorReport = () => {
    const { preview, fileName } = productionImport
    if (!preview || preview.errorRows === 0) return
    const blob = new Blob([buildErrorReportCsv(preview)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `production-import-errors-${fileName ?? 'workbook'}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const continueToPreview = () => {
    if (productionImport.createPreview()) {
      setImportError(null)
      setStep('preview')
    }
  }

  const preview = productionImport.preview
  const canImport = Boolean(
    preview?.payload?.length
    && preview.errorRows === 0
    && productionImport.validationStatus === 'passed'
    && !isImporting,
  )
  const importLabel = isImporting
    ? 'Importing…'
    : preview?.errorRows
      ? `Fix ${preview.errorRows} Invalid ${preview.errorRows === 1 ? 'Row' : 'Rows'} to Import`
      : productionImport.validationStatus !== 'passed'
        ? 'Revalidate Before Import'
        : `Import ${preview?.validRows ?? 0} Rows`

  return (
    <Dialog
      className="dialog--wide dialog--production-import"
      isCloseDisabled={isImporting || productionImport.isParsing || isRevalidating}
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
          ) : preview ? (
            <>
              <ImportPreview
                isValidating={productionImport.isValidating || isRevalidating}
                onEditRow={productionImport.editRow}
                preview={preview}
                validationStatus={isRevalidating ? 'pending' : productionImport.validationStatus}
              />
              <div className="production-import-preview-actions">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isImporting || isRevalidating || productionImport.isValidating}
                  isLoading={isRevalidating || productionImport.isValidating}
                  onClick={() => void revalidateWorkbook()}
                >
                  Revalidate
                </Button>
                {preview.errorRows > 0 ? (
                  <Button type="button" variant="secondary" disabled={isImporting} onClick={downloadErrorReport}>
                    Download Error Report
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
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
                <Button type="button" variant="secondary" disabled={isImporting || isRevalidating} onClick={() => setStep('mapping')}>Back to Mapping</Button>
                <Button
                  type="button"
                  disabled={!canImport}
                  isLoading={isImporting}
                  title={!canImport ? 'Fix all row errors and revalidate before importing.' : undefined}
                  onClick={() => void importWorkbook()}
                >
                  {importLabel}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Dialog>
  )
}
