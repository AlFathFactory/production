import { isDesktopRuntime } from '../../config/platform'
import { documentStorage } from '../supabase/documentStorage'

export type PdfSaveResult =
  | { status: 'cancelled' }
  | { status: 'downloaded' }
  | { path: string; status: 'saved' }

export function sanitizePdfFileName(value: string): string {
  const withoutExtension = value.replace(/\.pdf$/i, '')
  const sanitized = withoutExtension
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[ ._]+|[ ._]+$/g, '')
    .slice(0, 120)
  return `${sanitized || 'document'}.pdf`
}

function downloadPdfInBrowser(pdf: Blob, fileName: string): void {
  const url = URL.createObjectURL(pdf)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export async function savePdfFile(pdf: Blob, suggestedFileName: string): Promise<PdfSaveResult> {
  const fileName = sanitizePdfFileName(suggestedFileName)
  if (!isDesktopRuntime()) {
    downloadPdfInBrowser(pdf, fileName)
    return { status: 'downloaded' }
  }

  const { saveDesktopPdf } = await import('../desktop/desktopFiles')
  const path = await saveDesktopPdf(new Uint8Array(await pdf.arrayBuffer()), fileName)
  return path ? { path, status: 'saved' } : { status: 'cancelled' }
}

export async function downloadStoredPdf(path: string, suggestedFileName: string): Promise<PdfSaveResult> {
  if (!isDesktopRuntime()) {
    await documentStorage.downloadDocument(path, suggestedFileName)
    return { status: 'downloaded' }
  }

  return savePdfFile(await documentStorage.downloadDocumentBlob(path), suggestedFileName)
}

export async function revealSavedFile(path: string): Promise<void> {
  if (!isDesktopRuntime()) return
  const { revealDesktopFile } = await import('../desktop/desktopFiles')
  await revealDesktopFile(path)
}
