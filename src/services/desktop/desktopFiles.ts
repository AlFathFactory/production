export type DesktopDropEvent =
  | { type: 'enter' }
  | { type: 'leave' }
  | { paths: string[]; type: 'drop' }

export type DesktopFileErrorKind = 'open' | 'read' | 'reveal' | 'size' | 'unsupported' | 'write'

export class DesktopFileError extends Error {
  constructor(message: string, public readonly kind: DesktopFileErrorKind) {
    super(message)
    this.name = 'DesktopFileError'
  }
}

let lastOpenDirectory: string | null = null
let lastSaveDirectory: string | null = null

function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() || 'workbook.xlsx'
}

function directoryFromPath(path: string): string | null {
  const separatorIndex = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  return separatorIndex > 0 ? path.slice(0, separatorIndex) : null
}

function pathInDirectory(directory: string, fileName: string): string {
  const separator = directory.includes('\\') ? '\\' : '/'
  return `${directory}${directory.endsWith(separator) ? '' : separator}${fileName}`
}

function isExcelFileName(fileName: string): boolean {
  return /\.(xlsx|xls)$/i.test(fileName)
}

function excelMimeType(fileName: string): string {
  return fileName.toLowerCase().endsWith('.xls')
    ? 'application/vnd.ms-excel'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

export async function readDesktopExcelFile(path: string, maxSizeBytes: number): Promise<File> {
  const fileName = fileNameFromPath(path)
  if (!isExcelFileName(fileName)) {
    throw new DesktopFileError('File format is not supported. Choose an .xlsx or .xls workbook.', 'unsupported')
  }

  const { readFile, stat } = await import('@tauri-apps/plugin-fs')
  try {
    const fileInfo = await stat(path)
    if (!fileInfo.isFile) {
      throw new DesktopFileError('The selected item is not a file.', 'read')
    }
    if (fileInfo.size > maxSizeBytes) {
      throw new DesktopFileError('The workbook is larger than the 15 MB import limit.', 'size')
    }

    const bytes = await readFile(path)
    lastOpenDirectory = directoryFromPath(path)
    return new File([bytes], fileName, { type: excelMimeType(fileName) })
  } catch (error) {
    if (error instanceof DesktopFileError) throw error
    throw new DesktopFileError('File could not be read. Check that it is available and try again.', 'read')
  }
}

export async function pickDesktopExcelFile(maxSizeBytes: number): Promise<File | null> {
  const { open } = await import('@tauri-apps/plugin-dialog')
  let selectedPath: string | null
  try {
    selectedPath = await open({
      defaultPath: lastOpenDirectory ?? undefined,
      directory: false,
      filters: [{ name: 'Excel workbooks', extensions: ['xlsx', 'xls'] }],
      multiple: false,
      title: 'Select Production Excel Workbook',
    })
  } catch {
    throw new DesktopFileError('File could not be opened. Please try again.', 'open')
  }

  return selectedPath ? readDesktopExcelFile(selectedPath, maxSizeBytes) : null
}

export async function listenForDesktopFileDrops(
  onEvent: (event: DesktopDropEvent) => void,
): Promise<() => void> {
  const { getCurrentWebview } = await import('@tauri-apps/api/webview')
  return getCurrentWebview().onDragDropEvent((event) => {
    if (event.payload.type === 'enter') {
      onEvent({ type: 'enter' })
    } else if (event.payload.type === 'leave') {
      onEvent({ type: 'leave' })
    } else if (event.payload.type === 'drop') {
      onEvent({ paths: event.payload.paths, type: 'drop' })
    }
  })
}

export async function saveDesktopPdf(bytes: Uint8Array, suggestedFileName: string): Promise<string | null> {
  const { save } = await import('@tauri-apps/plugin-dialog')
  const { writeFile } = await import('@tauri-apps/plugin-fs')
  let selectedPath: string | null

  try {
    selectedPath = await save({
      defaultPath: lastSaveDirectory
        ? pathInDirectory(lastSaveDirectory, suggestedFileName)
        : suggestedFileName,
      filters: [{ name: 'PDF document', extensions: ['pdf'] }],
      title: 'Save PDF',
    })
  } catch {
    throw new DesktopFileError('The Save As dialog could not be opened. Please try again.', 'open')
  }

  if (!selectedPath) return null

  try {
    await writeFile(selectedPath, bytes)
    lastSaveDirectory = directoryFromPath(selectedPath)
    return selectedPath
  } catch {
    throw new DesktopFileError('The PDF could not be saved to the selected location.', 'write')
  }
}

export async function revealDesktopFile(path: string): Promise<void> {
  const { revealItemInDir } = await import('@tauri-apps/plugin-opener')
  try {
    await revealItemInDir(path)
  } catch {
    throw new DesktopFileError('The saved file could not be shown in File Explorer.', 'reveal')
  }
}
