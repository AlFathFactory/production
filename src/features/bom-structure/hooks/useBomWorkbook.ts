import { useRef, useState } from 'react'

import { BomWorkbookError, parseBomWorkbook } from '../parseBomWorkbook'
import { BomSourceFileError, getBomSourceMimeType } from '../bomSourceFile'
import type { BomParseResult } from '../types'

export { MAX_BOM_FILE_SIZE_BYTES } from '../bomSourceFile'

export function useBomWorkbook() {
  const selectionId = useRef(0)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [result, setResult] = useState<BomParseResult | null>(null)

  const selectFile = async (file: File) => {
    const requestId = ++selectionId.current
    setError(null)
    setResult(null)
    setFileName(null)
    setSourceFile(null)
    try {
      getBomSourceMimeType(file)
    } catch (validationError) {
      setError(validationError instanceof BomSourceFileError ? validationError.message : 'The workbook is not supported.')
      return
    }

    setIsParsing(true)
    try {
      const parsed = await parseBomWorkbook(await file.arrayBuffer())
      if (requestId !== selectionId.current) return
      setFileName(file.name)
      setSourceFile(file)
      setResult(parsed)
    } catch (parseError) {
      if (requestId !== selectionId.current) return
      setResult(null)
      setFileName(null)
      setSourceFile(null)
      setError(parseError instanceof BomWorkbookError
        ? parseError.message
        : 'The selected workbook could not be processed.')
    } finally {
      if (requestId === selectionId.current) setIsParsing(false)
    }
  }

  return { error, fileName, isParsing, result, selectFile, sourceFile }
}
