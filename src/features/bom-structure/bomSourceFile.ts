import { BOM_ALLOWED_EXTENSIONS, BOM_SOURCE_MIME_TYPES, MAX_BOM_FILE_SIZE_BYTES } from './bomSettings'

export { BOM_PARSER_VERSION, MAX_BOM_FILE_SIZE_BYTES } from './bomSettings'

export class BomSourceFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BomSourceFileError'
  }
}

export function getBomSourceMimeType(file: File): string {
  const extension = /\.([^.]+)$/.exec(file.name)?.[1]?.toLowerCase()
  if (!BOM_ALLOWED_EXTENSIONS.some((allowed) => allowed === extension)) {
    throw new BomSourceFileError('Choose an Excel workbook with an .xlsx or .xls extension.')
  }
  if (file.size < 1 || file.size > MAX_BOM_FILE_SIZE_BYTES) {
    throw new BomSourceFileError('The workbook must be between 1 byte and 25 MB.')
  }

  const expectedMimeType = BOM_SOURCE_MIME_TYPES[extension as keyof typeof BOM_SOURCE_MIME_TYPES]
  // Some browsers leave File.type empty. The extension supplies the bucket's canonical MIME in that case.
  if (file.type && file.type.toLowerCase() !== expectedMimeType) {
    throw new BomSourceFileError('The workbook MIME type does not match its Excel extension.')
  }
  return expectedMimeType
}

export function getBomSourceObjectPath(importId: string, originalFileName: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(importId)) {
    throw new BomSourceFileError('The BOM import ID is invalid.')
  }
  const baseName = originalFileName.split(/[\\/]/).pop() ?? ''
  const extension = /\.([^.]+)$/.exec(baseName)?.[1]?.toLowerCase()
  if (!extension || !BOM_ALLOWED_EXTENSIONS.some((allowed) => allowed === extension)) throw new BomSourceFileError('The workbook extension is invalid.')
  const stem = baseName.slice(0, -(extension.length + 1))
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'workbook'
  return `${importId}/${stem}.${extension}`
}

export async function sha256BomSourceFile(file: File): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new BomSourceFileError('SHA-256 is unavailable in this browser context. Open the app in a secure context and try again.')
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
