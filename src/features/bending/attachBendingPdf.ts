import { DocumentStorageError, documentStorage, type DocumentUploadResult } from '../../services/supabase/documentStorage'
import { bendingPdfRepository } from './bendingPdfRepository'
import type { BendingPdfTarget } from './types'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The PDF path could not be attached to the document.'
}

async function throwAttachmentFailure(error: unknown, upload: DocumentUploadResult): Promise<never> {
  if (!upload.wasUploaded) {
    throw new Error(`${errorMessage(error)} The existing uploaded PDF may remain unattached in Storage.`)
  }

  try {
    await documentStorage.removeDocument(upload.path)
  } catch (cleanupError) {
    const cleanupMessage = cleanupError instanceof DocumentStorageError && cleanupError.kind === 'permission'
      ? 'Your role cannot remove it, so the uploaded PDF may remain orphaned in Storage.'
      : 'Cleanup also failed, so the uploaded PDF may remain orphaned in Storage.'
    throw new Error(`${errorMessage(error)} ${cleanupMessage}`)
  }

  throw new Error(`${errorMessage(error)} The uploaded PDF was removed from Storage.`)
}

export async function attachBendingPdf(target: BendingPdfTarget): Promise<string> {
  if (target.kind === 'return' && !target.id) {
    throw new Error('Internal error: the created Bending Return ID is missing. The PDF was not queried or uploaded.')
  }
  if (target.pdfPath) return target.pdfPath

  let generator: typeof import('./pdf/bendingPdfGenerator')
  try {
    generator = await import('./pdf/bendingPdfGenerator')
  } catch {
    throw new Error('The PDF generator could not be loaded. Check your connection and retry.')
  }

  if (target.kind === 'dispatch') {
    const model = await bendingPdfRepository.getDispatchModel(target.id)
    let pdf: Blob
    try {
      pdf = await generator.generateDispatchPdf(model)
    } catch {
      throw new Error('The Dispatch PDF could not be generated. Please retry.')
    }
    const upload = await documentStorage.uploadDispatchPdf(target.reference, target.id, pdf)
    try {
      return await bendingPdfRepository.saveDispatchPdfPath(target.id, upload.path)
    } catch (error) {
      return throwAttachmentFailure(error, upload)
    }
  }

  const model = await bendingPdfRepository.getReturnModel(target.id)
  let pdf: Blob
  try {
    pdf = await generator.generateReturnPdf(model)
  } catch {
    throw new Error('The Return PDF could not be generated. Please retry.')
  }
  const upload = await documentStorage.uploadReturnPdf(target.reference, target.id, pdf)
  try {
    return await bendingPdfRepository.saveReturnPdfPath(target.id, upload.path)
  } catch (error) {
    return throwAttachmentFailure(error, upload)
  }
}
