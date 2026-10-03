import { useState } from 'react'

import {
  detectProductionHeaderRow,
  getMissingRequiredMappings,
  getProductionSourceColumns,
  mapProductionRows,
  suggestProductionColumnMapping,
} from '../productionColumnMapping'
import { parseProductionWorkbook, ProductionWorkbookError } from '../parseProductionWorkbook'
import type {
  ParsedProductionWorkbook,
  ProductionImportField,
  ProductionImportMapping,
  ProductionImportPreview,
  ProductionSourceColumn,
} from '../types'
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
  const [headerRow, setHeaderRow] = useState<number | null>(null)
  const [sourceColumns, setSourceColumns] = useState<ProductionSourceColumn[]>([])
  const [mapping, setMapping] = useState<ProductionImportMapping>({})
  const [preview, setPreview] = useState<ProductionImportPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)

  const configureSheet = (parsedWorkbook: ParsedProductionWorkbook, nextSheetName: string) => {
    setSheetName(nextSheetName)
    setHeaderRow(null)
    setSourceColumns([])
    setMapping({})
    setPreview(null)
    setError(null)

    try {
      const rows = parsedWorkbook.sheets[nextSheetName]
      if (!rows) {
        throw new ProductionWorkbookError('The selected workbook sheet is unavailable.')
      }
      const detectedHeaderRow = detectProductionHeaderRow(rows)
      const columns = getProductionSourceColumns(rows, detectedHeaderRow)
      setHeaderRow(detectedHeaderRow)
      setSourceColumns(columns)
      setMapping(suggestProductionColumnMapping(columns))
    } catch (configurationError) {
      setError(errorMessage(configurationError))
    }
  }

  const selectFile = async (file: File) => {
    setPreview(null)
    setWorkbook(null)
    setSheetName(null)
    setHeaderRow(null)
    setSourceColumns([])
    setMapping({})
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
      configureSheet(parsedWorkbook, firstSheetName)
    } catch (parseError) {
      setError(errorMessage(parseError))
    } finally {
      setIsParsing(false)
    }
  }

  const selectSheet = (nextSheetName: string) => {
    if (workbook) {
      configureSheet(workbook, nextSheetName)
    }
  }

  const selectHeaderRow = (nextHeaderRow: number) => {
    if (!workbook || !sheetName) return
    const rows = workbook.sheets[sheetName]
    if (!rows) return
    try {
      const columns = getProductionSourceColumns(rows, nextHeaderRow)
      setHeaderRow(nextHeaderRow)
      setSourceColumns(columns)
      setMapping(suggestProductionColumnMapping(columns))
      setPreview(null)
      setError(null)
    } catch (headerError) {
      setError(errorMessage(headerError))
    }
  }

  const mapColumn = (columnIndex: number, field: ProductionImportField | null) => {
    setMapping((current) => ({ ...current, [columnIndex]: field }))
    setPreview(null)
    setError(null)
  }

  const createPreview = (): boolean => {
    if (!workbook || !sheetName || headerRow === null) return false
    const missing = getMissingRequiredMappings(mapping)
    if (missing.length > 0) {
      setError(`Required fields are not mapped: ${missing.map((field) => field.label).join(', ')}.`)
      return false
    }
    try {
      const rows = workbook.sheets[sheetName]
      if (!rows) throw new ProductionWorkbookError('The selected workbook sheet is unavailable.')
      setPreview(validateProductionRows(mapProductionRows(rows, headerRow, mapping)))
      setError(null)
      return true
    } catch (previewError) {
      setError(errorMessage(previewError))
      return false
    }
  }

  const reset = () => {
    setFileName(null)
    setWorkbook(null)
    setSheetName(null)
    setHeaderRow(null)
    setSourceColumns([])
    setMapping({})
    setPreview(null)
    setError(null)
    setIsParsing(false)
  }

  return {
    createPreview,
    error,
    fileName,
    headerRow,
    headerRowOptions: workbook && sheetName
      ? workbook.sheets[sheetName].slice(0, 20).map((_, index) => index + 1)
      : [],
    isParsing,
    mapColumn,
    mapping,
    missingRequiredFields: getMissingRequiredMappings(mapping),
    preview,
    reset,
    selectFile,
    selectHeaderRow,
    selectSheet,
    sheetName,
    sheetNames: workbook?.sheetNames ?? [],
    sourceColumns,
  }
}
