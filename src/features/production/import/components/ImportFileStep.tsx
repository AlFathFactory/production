import { useEffect, useRef, useState } from 'react'

import { Button } from '../../../../components/ui/Button'
import { FormField } from '../../../../components/ui/FormField'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'
import { Select } from '../../../../components/ui/Select'
import {
  listenForExcelFileDrops,
  pickExcelFile,
  readDroppedExcelFile,
  usesDesktopExcelHandling,
} from '../../../../services/files/excelFiles'
import { MAX_IMPORT_FILE_SIZE_BYTES } from '../hooks/useProductionImport'

interface ImportFileStepProps {
  error: string | null
  fileName: string | null
  isDisabled: boolean
  isParsing: boolean
  onFileSelect: (file: File) => Promise<void>
  onSheetSelect: (sheetName: string) => void
  sheetName: string | null
  sheetNames: string[]
}

export function ImportFileStep({
  error,
  fileName,
  isDisabled,
  isParsing,
  onFileSelect,
  onSheetSelect,
  sheetName,
  sheetNames,
}: ImportFileStepProps) {
  const isDesktop = usesDesktopExcelHandling()
  const [isDragging, setIsDragging] = useState(false)
  const [isPicking, setIsPicking] = useState(false)
  const [nativeError, setNativeError] = useState<string | null>(null)
  const isDisabledRef = useRef(isDisabled)
  const onFileSelectRef = useRef(onFileSelect)
  const lastDropRef = useRef({ key: '', time: 0 })

  isDisabledRef.current = isDisabled
  onFileSelectRef.current = onFileSelect

  useEffect(() => {
    if (!isDesktop) return

    let disposed = false
    let unlisten: (() => void) | undefined
    void listenForExcelFileDrops((event) => {
      if (disposed || isDisabledRef.current) return
      if (event.type === 'enter') {
        setIsDragging(true)
        return
      }
      if (event.type === 'leave') {
        setIsDragging(false)
        return
      }

      setIsDragging(false)
      const key = event.paths.join('\n')
      const now = Date.now()
      if (key === lastDropRef.current.key && now - lastDropRef.current.time < 250) return
      lastDropRef.current = { key, time: now }

      if (event.paths.length !== 1) {
        setNativeError('Drop one Excel workbook at a time.')
        return
      }

      setNativeError(null)
      void readDroppedExcelFile(event.paths[0], MAX_IMPORT_FILE_SIZE_BYTES)
        .then((file) => onFileSelectRef.current(file))
        .catch((dropError: unknown) => {
          setNativeError(dropError instanceof Error ? dropError.message : 'The dropped file could not be read.')
        })
    }).then((stopListening) => {
      if (disposed) stopListening()
      else unlisten = stopListening
    }).catch(() => {
      if (!disposed) setNativeError('Desktop drag and drop is unavailable. Use Upload Excel instead.')
    })

    return () => {
      disposed = true
      unlisten?.()
    }
  }, [isDesktop])

  const pickFile = async () => {
    setNativeError(null)
    setIsPicking(true)
    try {
      const file = await pickExcelFile(MAX_IMPORT_FILE_SIZE_BYTES)
      if (file) await onFileSelect(file)
    } catch (pickError) {
      setNativeError(pickError instanceof Error ? pickError.message : 'File could not be opened. Please try again.')
    } finally {
      setIsPicking(false)
    }
  }

  return (
    <section className="production-import-file" aria-label="Workbook selection">
      {isDesktop ? (
        <div className={`production-native-file-drop${isDragging ? ' production-native-file-drop--active' : ''}`}>
          <div>
            <strong>{isDragging ? 'Drop Excel file here' : 'Upload or drop a Production Excel file'}</strong>
            <span>.xlsx or .xls, maximum 15 MB</span>
          </div>
          <Button
            disabled={isDisabled}
            isLoading={isPicking}
            type="button"
            onClick={() => void pickFile()}
          >
            Upload Excel
          </Button>
        </div>
      ) : (
        <FormField label="Preparation workbook" htmlFor="production-import-file" hint=".xlsx or .xls, maximum 15 MB">
          <input
            accept=".xlsx,.xls"
            className="production-file-input"
            disabled={isDisabled}
            id="production-import-file"
            type="file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              if (file) {
                void onFileSelect(file)
              }
              event.currentTarget.value = ''
            }}
          />
        </FormField>
      )}

      {isParsing ? <p className="production-import-file__status" role="status"><LoadingSpinner size="small" label="Parsing workbook" /> Parsing workbook…</p> : null}
      {fileName ? <p className="production-import-file__name"><span>File</span><strong>{fileName}</strong></p> : null}
      {sheetNames.length > 1 ? (
        <FormField label="Sheet" htmlFor="production-import-sheet">
          <Select id="production-import-sheet" disabled={isDisabled} value={sheetName ?? ''} onChange={(event) => onSheetSelect(event.target.value)}>
            {sheetNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </Select>
        </FormField>
      ) : null}
      {sheetNames.length === 1 && sheetName ? <p className="production-import-file__name"><span>Sheet</span><strong>{sheetName}</strong></p> : null}
      {nativeError || error ? <p className="form-error" role="alert">{nativeError ?? error}</p> : null}
    </section>
  )
}
