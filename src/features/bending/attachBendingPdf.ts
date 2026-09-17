import { documentStorage } from '../../services/supabase/documentStorage'
import { bendingPdfRepository } from './bendingPdfRepository'
import type { BendingPdfTarget } from './types'

export async function attachBendingPdf(target: BendingPdfTarget): Promise<string> {
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
      pdf = generator.generateDispatchPdf(model)
    } catch {
      throw new Error('The Dispatch PDF could not be generated. Please retry.')
    }
    const path = await documentStorage.uploadDispatchPdf(target.reference, target.id, pdf)
    await bendingPdfRepository.saveDispatchPdfPath(target.id, path)
    return path
  }

  const model = await bendingPdfRepository.getReturnModel(target.id)
  let pdf: Blob
  try {
    pdf = generator.generateReturnPdf(model)
  } catch {
    throw new Error('The Return PDF could not be generated. Please retry.')
  }
  const path = await documentStorage.uploadReturnPdf(target.reference, target.id, pdf)
  await bendingPdfRepository.saveReturnPdfPath(target.id, path)
  return path
}
