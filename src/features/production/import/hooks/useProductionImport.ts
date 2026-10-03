import { useState } from 'react'

import { productionRepository } from '../../productionRepository'
import { normalizeProductionDate } from '../normalizeProductionDate'
import {
  detectProductionHeaderRow,
  getMissingRequiredMappings,
  getProductionSourceColumns,
  mapProductionRows,
  PRODUCTION_IMPORT_FIELDS,
  suggestProductionColumnMapping,
} from '../productionColumnMapping'
import { parseProductionWorkbook, ProductionWorkbookError } from '../parseProductionWorkbook'
import type {
  ParsedProductionWorkbook,
  ProductionImportField,
  ProductionImportMapping,
  ProductionImportPreview,
  ProductionImportValidationStatus,
  ProductionSourceColumn,
  NormalizedProductionImportRow,
  NormalizedProductionSheet,
} from '../types'
import { applyBackendValidation, validateProductionRows } from '../validateProductionRows'

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

export function useProductionImport(lotId: string) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [workbook, setWorkbook] = useState<ParsedProductionWorkbook | null>(null)
  const [sheetName, setSheetName] = useState<string | null>(null)
  const [headerRow, setHeaderRow] = useState<number | null>(null)
  const [sourceColumns, setSourceColumns] = useState<ProductionSourceColumn[]>([])
  const [mapping, setMapping] = useState<ProductionImportMapping>({})
  const [preview, setPreview] = useState<ProductionImportPreview | null>(null)
  const [editableSheet, setEditableSheet] = useState<NormalizedProductionSheet | null>(null)
  const [originalRows, setOriginalRows] = useState<ReadonlyMap<number, NormalizedProductionImportRow>>(new Map())
  const [validationStatus, setValidationStatus] = useState<ProductionImportValidationStatus>('not-run')
  const [error, setError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)

  const runBackendValidation = async (localPreview: ProductionImportPreview) => {
    if (!localPreview.payload) {
      setPreview(localPreview)
      setValidationStatus('not-run')
      return false
    }

    setValidationStatus('pending')
    setError(null)
    try {
      const result = await productionRepository.validateProductionPreparationRows({ lotId, rows: localPreview.payload })
      setPreview(applyBackendValidation(localPreview, result))
      setValidationStatus(result.valid ? 'passed' : 'failed')
      return result.valid
    } catch (validationError) {
      setPreview(localPreview)
      setValidationStatus('failed')
      setError(validationError instanceof Error ? validationError.message : 'Backend validation could not be completed.')
      return false
    }
  }

  const configureSheet = (parsedWorkbook: ParsedProductionWorkbook, nextSheetName: string) => {
    setSheetName(nextSheetName)
    setHeaderRow(null)
    setSourceColumns([])
    setMapping({})
    setPreview(null)
    setEditableSheet(null)
    setOriginalRows(new Map())
    setValidationStatus('not-run')
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
    setEditableSheet(null)
    setOriginalRows(new Map())
    setValidationStatus('not-run')

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
      setEditableSheet(null)
      setOriginalRows(new Map())
      setValidationStatus('not-run')
      setError(null)
    } catch (headerError) {
      setError(errorMessage(headerError))
    }
  }

  const mapColumn = (columnIndex: number, field: ProductionImportField | null) => {
    setMapping((current) => ({ ...current, [columnIndex]: field }))
    setPreview(null)
    setEditableSheet(null)
    setOriginalRows(new Map())
    setValidationStatus('not-run')
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
      const sheet = mapProductionRows(rows, headerRow, mapping)
      const originals = new Map(sheet.rows.map(({ row }) => [row.source_row, { ...row }]))
      const localPreview = validateProductionRows(sheet, originals)
      setEditableSheet(sheet)
      setOriginalRows(originals)
      setPreview(localPreview)
      setValidationStatus('not-run')
      setError(null)
      void runBackendValidation(localPreview)
      return true
    } catch (previewError) {
      setError(errorMessage(previewError))
      return false
    }
  }

  const editRow = (sourceRow: number, field: ProductionImportField, rawValue: string) => {
    if (!editableSheet) return
    const definition = PRODUCTION_IMPORT_FIELDS.find((candidate) => candidate.key === field)
    if (!definition) return

    const nextSheet: NormalizedProductionSheet = {
      ...editableSheet,
      rows: editableSheet.rows.map((entry) => {
        if (entry.row.source_row !== sourceRow) return entry
        const row = { ...entry.row }
        const editableValues = row as Partial<Record<ProductionImportField, string | number | null>>
        const issues = entry.issues.filter((issue) => issue.field !== field)
        const trimmed = rawValue.trim()

        if (definition.kind === 'number') {
          const blankValue = field === 'total_quantity' || field === 'unit_weight_kg' ? null : 0
          const parsed = trimmed === '' ? blankValue : Number(trimmed)
          if (parsed !== null && !Number.isFinite(parsed)) {
            editableValues[field] = null
            issues.push({
              field,
              message: `${definition.label} is not a valid number.`,
              origin: 'local',
              severity: 'error',
              sourceRow,
            })
          } else {
            editableValues[field] = parsed
          }
        } else if (definition.kind === 'date') {
          const normalized = normalizeProductionDate(trimmed || null)
          editableValues[field] = normalized.value
          if (!normalized.isValid) {
            issues.push({
              field,
              message: `${definition.label} is not a recognized date.`,
              origin: 'local',
              severity: 'error',
              sourceRow,
            })
          }
        } else if (definition.kind === 'route') {
          row.routing = rawValue as NormalizedProductionImportRow['routing']
        } else if (field === 'article') {
          row.article = trimmed
        } else {
          editableValues[field] = trimmed || null
        }

        return { issues, row }
      }),
    }

    setEditableSheet(nextSheet)
    setPreview(validateProductionRows(nextSheet, originalRows))
    setValidationStatus('not-run')
    setError(null)
  }

  const revalidate = async () => {
    if (!editableSheet) return false
    const localPreview = validateProductionRows(editableSheet, originalRows)
    setPreview(localPreview)
    return runBackendValidation(localPreview)
  }

  const reset = () => {
    setFileName(null)
    setWorkbook(null)
    setSheetName(null)
    setHeaderRow(null)
    setSourceColumns([])
    setMapping({})
    setPreview(null)
    setEditableSheet(null)
    setOriginalRows(new Map())
    setValidationStatus('not-run')
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
    isValidating: validationStatus === 'pending',
    editRow,
    mapColumn,
    mapping,
    missingRequiredFields: getMissingRequiredMappings(mapping),
    preview,
    revalidate,
    reset,
    selectFile,
    selectHeaderRow,
    selectSheet,
    sheetName,
    sheetNames: workbook?.sheetNames ?? [],
    sourceColumns,
    validationStatus,
  }
}
