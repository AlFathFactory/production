import { supabase } from './client'

const DOCUMENT_BUCKET = 'production-documents'
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024
const SIGNED_URL_EXPIRY_SECONDS = 120

export type DocumentStorageErrorKind = 'download' | 'network' | 'permission' | 'remove' | 'size' | 'signed_url' | 'upload'

export interface DocumentUploadResult {
  path: string
  wasUploaded: boolean
}

export class DocumentStorageError extends Error {
  constructor(message: string, public readonly kind: DocumentStorageErrorKind) {
    super(message)
    this.name = 'DocumentStorageError'
  }
}

function storageErrorDetails(error: unknown) {
  if (typeof error !== 'object' || error === null) return { message: '', statusCode: '' }
  return {
    message: 'message' in error ? String(error.message) : '',
    statusCode: 'statusCode' in error ? String(error.statusCode) : '',
  }
}

function mapStorageError(error: unknown, action: 'download' | 'remove' | 'signed_url' | 'upload') {
  const { message, statusCode } = storageErrorDetails(error)
  if (statusCode === '401' || statusCode === '403' || /permission|policy|unauthorized|forbidden/i.test(message)) {
    return new DocumentStorageError('You do not have permission to access this PDF.', 'permission')
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new DocumentStorageError('Unable to reach document storage. Check your connection and retry.', 'network')
  }
  const messages = {
    download: 'The PDF download could not be started. Please retry.',
    remove: 'The uploaded PDF could not be removed from Storage.',
    signed_url: 'A secure link for this PDF could not be created. Please retry.',
    upload: 'The PDF could not be uploaded. Please retry.',
  } as const
  return new DocumentStorageError(messages[action], action)
}

function sanitizePathPart(value: string): string {
  const sanitized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
  return sanitized || 'document'
}

function getPdfPath(folder: string, prefix: string, reference: string, id: string): string {
  return `${folder}/${prefix}_${sanitizePathPart(reference)}_${sanitizePathPart(id)}.pdf`
}

async function uploadPdf(path: string, pdf: Blob): Promise<DocumentUploadResult> {
  if (pdf.size > MAX_PDF_SIZE_BYTES) {
    throw new DocumentStorageError('The generated PDF is larger than the 10 MB upload limit.', 'size')
  }

  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, pdf, {
    contentType: 'application/pdf',
    upsert: false,
  })

  if (error) {
    const { message, statusCode } = storageErrorDetails(error)
    if (statusCode === '409' || /duplicate|already exists|resource already exists/i.test(message)) {
      return { path, wasUploaded: false }
    }
    throw mapStorageError(error, 'upload')
  }

  return { path: data.path, wasUploaded: true }
}

export const documentStorage = {
  buildDispatchPath(reference: string, id: string): string {
    return getPdfPath('bending-dispatches', 'dispatch', reference, id)
  },

  buildReturnPath(reference: string, id: string): string {
    return getPdfPath('bending-returns', 'return', reference, id)
  },

  uploadDispatchPdf(reference: string, id: string, pdf: Blob): Promise<DocumentUploadResult> {
    return uploadPdf(this.buildDispatchPath(reference, id), pdf)
  },

  uploadReturnPdf(reference: string, id: string, pdf: Blob): Promise<DocumentUploadResult> {
    return uploadPdf(this.buildReturnPath(reference, id), pdf)
  },

  async createSignedUrl(path: string, downloadFileName?: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS, downloadFileName ? { download: downloadFileName } : undefined)
    if (error) throw mapStorageError(error, 'signed_url')
    return data.signedUrl
  },

  async removeDocument(path: string): Promise<void> {
    const { error } = await supabase.storage.from(DOCUMENT_BUCKET).remove([path])
    if (error) throw mapStorageError(error, 'remove')
  },

  async downloadDocumentBlob(path: string): Promise<Blob> {
    const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).download(path)
    if (error) throw mapStorageError(error, 'download')
    return data
  },

  async downloadDocument(path: string, fileName: string): Promise<void> {
    try {
      const signedUrl = await this.createSignedUrl(path, sanitizePathPart(fileName) + '.pdf')
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = ''
      link.rel = 'noopener'
      document.body.append(link)
      link.click()
      link.remove()
    } catch (error) {
      if (error instanceof DocumentStorageError) throw error
      throw mapStorageError(error, 'download')
    }
  },
}
