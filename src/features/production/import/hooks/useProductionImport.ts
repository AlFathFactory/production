import { useState } from 'react'

import { normalizeProductionRows } from '../normalizeProductionRows'
import { parseProductionWorkbook, ProductionWorkbookError } from '../parseProductionWorkbook'
import type { ParsedProductionWorkbook, ProductionImportPreview } from '../types'
import { validateProductionRows } from '../validateProductionRows'

export const MAX_IMPORT_FILE_SIZE_BYTES = 15 * 1024 * 1024

function isSupportedFile(file: File): boolean {
  const extension = file.name.toLowerCase().split('.').pop()
  return extension === 'xlsx' || extension === 'xls'
}

function errorMessage(error: unknown): string {
  return error instanceof ProductionWorkbookError
    ? error.message
    : 'The selected workbook could not be processed.'
}

export function useProductionImport() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [workbook, setWorkbook] = useState<ParsedProductionWorkbook | null>(null)
  const [sheetName, setSheetName] = useState<string | null>(null)
  const [preview, setPreview] = useState<ProductionImportPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)

  const previewSheet = (parsedWorkbook: ParsedProductionWorkbook, nextSheetName: string) => {
    setSheetName(nextSheetName)
    setPreview(null)
    setError(null)

    try {
      const rows = parsedWorkbook.sheets[nextSheetName]
      if (!rows) {
        throw new ProductionWorkbookError('The selected workbook sheet is unavailable.')
      }
      setPreview(validateProductionRows(normalizeProductionRows(rows)))
    } catch (previewError) {
      setError(errorMessage(previewError))
    }
  }

  const selectFile = async (file: File) => {
    setPreview(null)
    setWorkbook(null)
    setSheetName(null)
    setFileName(null)
    setError(null)

    if (!isSupportedFile(file)) {
      setError('Choose an Excel workbook with an .xlsx or .xls extension.')
      return
    }
    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      setError('The workbook is larger than the 15 MB import limit.')
      return
    }

    setIsParsing(true)
    try {
      const parsedWorkbook = await parseProductionWorkbook(await file.arrayBuffer())
      const firstSheetName = parsedWorkbook.sheetNames[0]
      setFileName(file.name)
      setWorkbook(parsedWorkbook)
      previewSheet(parsedWorkbook, firstSheetName)
    } catch (parseError) {
      setError(errorMessage(parseError))
    } finally {
      setIsParsing(false)
    }
  }

  const selectSheet = (nextSheetName: string) => {
    if (workbook) {
      previewSheet(workbook, nextSheetName)
    }
  }

  const reset = () => {
    setFileName(null)
    setWorkbook(null)
    setSheetName(null)
    setPreview(null)
    setError(null)
    setIsParsing(false)
  }

  return {
    error,
    fileName,
    isParsing,
    preview,
    reset,
    selectFile,
    selectSheet,
    sheetName,
    sheetNames: workbook?.sheetNames ?? [],
  }
}
