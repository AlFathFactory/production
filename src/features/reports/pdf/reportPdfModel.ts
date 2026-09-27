import type { ReportContextData, ReportRow } from '../types'
import type { ReportSummaryData } from '../utils/reportSummary'

export interface ProductionReportPdfModel {
  generatedAt: string
  generatedBy: string
  context: ReportContextData
  summary: ReportSummaryData
  rows: ReportRow[]
}
