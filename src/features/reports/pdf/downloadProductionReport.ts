import { savePdfFile, type PdfSaveResult } from '../../../services/files/pdfFiles'
import type { ProductionReportPdfModel } from './reportPdfModel'

function sanitizeFilename(value: string): string {
  return value
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_ .]+|[_ .]+$/g, '')
}

export function buildProductionReportFilename(
  dateFrom: string | null,
  dateTo: string | null,
): string {
  let suffix = 'All_Dates'
  if (dateFrom && dateTo) {
    suffix = dateFrom === dateTo ? dateFrom : `${dateFrom}_to_${dateTo}`
  } else if (dateFrom) {
    suffix = `from_${dateFrom}`
  } else if (dateTo) {
    suffix = `through_${dateTo}`
  }

  return `${sanitizeFilename(`Production_Report_${suffix}`)}.pdf`
}

export async function downloadProductionReport(
  model: ProductionReportPdfModel,
  filename: string,
): Promise<PdfSaveResult> {
  const { generateProductionReportPdf } = await import('./productionReportPdfGenerator')
  const pdf = await generateProductionReportPdf(model)
  return savePdfFile(pdf, filename)
}
