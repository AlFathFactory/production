import { useEffect, useRef, useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import {
  listenForExcelFileDrops,
  pickExcelFile,
  readDroppedExcelFile,
  usesDesktopExcelHandling,
} from '../../../services/files/excelFiles'
import { MAX_BOM_FILE_SIZE_BYTES } from '../hooks/useBomWorkbook'

interface BomFilePickerProps {
  error: string | null
  fileName: string | null
  isParsing: boolean
  onFileSelect: (file: File) => Promise<void>
}

export function BomFilePicker({ error, fileName, isParsing, onFileSelect }: BomFilePickerProps) {
  const isDesktop = usesDesktopExcelHandling()
  const inputRef = useRef<HTMLInputElement>(null)
  const onFileSelectRef = useRef(onFileSelect)
  const [isDragging, setIsDragging] = useState(false)
  const [isPicking, setIsPicking] = useState(false)
  const [nativeError, setNativeError] = useState<string | null>(null)
  const lastDropRef = useRef({ key: '', time: 0 })
  onFileSelectRef.current = onFileSelect

  useEffect(() => {
    if (!isDesktop) return
    let disposed = false
    let unlisten: (() => void) | undefined

    void listenForExcelFileDrops((event) => {
      if (disposed || isParsing) return
      if (event.type === 'enter') return setIsDragging(true)
      if (event.type === 'leave') return setIsDragging(false)
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
      void readDroppedExcelFile(event.paths[0], MAX_BOM_FILE_SIZE_BYTES)
        .then((file) => onFileSelectRef.current(file))
        .catch((dropError: unknown) => setNativeError(
          dropError instanceof Error ? dropError.message : 'The dropped file could not be read.',
        ))
    }).then((stopListening) => {
      if (disposed) stopListening()
      else unlisten = stopListening
    }).catch(() => {
      if (!disposed) setNativeError('Desktop drag and drop is unavailable. Use Select Excel instead.')
    })

    return () => {
      disposed = true
      unlisten?.()
    }
  }, [isDesktop, isParsing])

  const chooseFile = async () => {
    setNativeError(null)
    if (!isDesktop) {
      inputRef.current?.click()
      return
    }
    setIsPicking(true)
    try {
      const file = await pickExcelFile(MAX_BOM_FILE_SIZE_BYTES)
      if (file) await onFileSelect(file)
    } catch (pickError) {
      setNativeError(pickError instanceof Error ? pickError.message : 'File could not be opened.')
    } finally {
      setIsPicking(false)
    }
  }

  const acceptWebDrop = (files: FileList | null) => {
    setIsDragging(false)
    if (!files?.length) return
    if (files.length !== 1) {
      setNativeError('Drop one Excel workbook at a time.')
      return
    }
    setNativeError(null)
    void onFileSelect(files[0])
  }

  return (
    <section
      className={`bom-file-picker${isDragging ? ' bom-file-picker--active' : ''}`}
      aria-label="BOM workbook selection"
      onDragEnter={!isDesktop ? (event) => { event.preventDefault(); setIsDragging(true) } : undefined}
      onDragLeave={!isDesktop ? (event) => { event.preventDefault(); setIsDragging(false) } : undefined}
      onDragOver={!isDesktop ? (event) => event.preventDefault() : undefined}
      onDrop={!isDesktop ? (event) => { event.preventDefault(); acceptWebDrop(event.dataTransfer.files) } : undefined}
    >
      <div className="bom-file-picker__copy">
        <span className="bom-file-picker__icon" aria-hidden="true">XLS</span>
        <div>
          <strong>{isDragging ? 'Drop the workbook here' : 'Select a Penta BOM structure workbook'}</strong>
          <span>.xlsx or .xls · first worksheet · maximum 15 MB · parsed locally</span>
        </div>
      </div>
      <Button disabled={isParsing} isLoading={isPicking} type="button" onClick={() => void chooseFile()}>
        {fileName ? 'Replace Excel' : 'Select Excel'}
      </Button>
      <input
        ref={inputRef}
        accept=".xlsx,.xls"
        className="bom-file-picker__input"
        disabled={isParsing}
        type="file"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) void onFileSelect(file)
          event.currentTarget.value = ''
        }}
      />
      {isParsing ? (
        <p className="bom-file-picker__status" role="status"><LoadingSpinner size="small" label="Parsing workbook" /> Parsing workbook…</p>
      ) : null}
      {fileName ? <p className="bom-file-picker__file"><span>Loaded</span><strong>{fileName}</strong></p> : null}
      {nativeError || error ? <p className="form-error bom-file-picker__error" role="alert">{nativeError ?? error}</p> : null}
    </section>
  )
}

