import { isDesktopRuntime } from '../../config/platform'

export type ExcelDropEvent =
  | { type: 'enter' }
  | { type: 'leave' }
  | { paths: string[]; type: 'drop' }

export function usesDesktopExcelHandling(): boolean {
  return isDesktopRuntime()
}

export async function pickExcelFile(maxSizeBytes: number): Promise<File | null> {
  if (!isDesktopRuntime()) return null
  const { pickDesktopExcelFile } = await import('../desktop/desktopFiles')
  return pickDesktopExcelFile(maxSizeBytes)
}

export async function readDroppedExcelFile(path: string, maxSizeBytes: number): Promise<File> {
  const { readDesktopExcelFile } = await import('../desktop/desktopFiles')
  return readDesktopExcelFile(path, maxSizeBytes)
}

export async function listenForExcelFileDrops(
  onEvent: (event: ExcelDropEvent) => void,
): Promise<() => void> {
  if (!isDesktopRuntime()) return () => undefined
  const { listenForDesktopFileDrops } = await import('../desktop/desktopFiles')
  return listenForDesktopFileDrops(onEvent)
}
