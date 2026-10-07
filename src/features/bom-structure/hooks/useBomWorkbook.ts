import { useState } from 'react'

import { BomWorkbookError, parseBomWorkbook } from '../parseBomWorkbook'
import type { BomParseResult } from '../types'

export const MAX_BOM_FILE_SIZE_BYTES = 15 * 1024 * 1024

function isSupportedFile(file: File): boolean {
  return /\.(xlsx|xls)$/i.test(file.name)
}

export function useBomWorkbook() {
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [result, setResult] = useState<BomParseResult | null>(null)

  const selectFile = async (file: File) => {
    setError(null)
    if (!isSupportedFile(file)) {
      setError('Choose an Excel workbook with an .xlsx or .xls extension.')
      return
    }
    if (file.size > MAX_BOM_FILE_SIZE_BYTES) {
      setError('The workbook is larger than the 15 MB import limit.')
      return
    }

    setIsParsing(true)
    try {
      const parsed = await parseBomWorkbook(await file.arrayBuffer())
      setFileName(file.name)
      setResult(parsed)
    } catch (parseError) {
      setResult(null)
      setFileName(null)
      setError(parseError instanceof BomWorkbookError
        ? parseError.message
        : 'The selected workbook could not be processed.')
    } finally {
      setIsParsing(false)
    }
  }

  return { error, fileName, isParsing, result, selectFile }
}

