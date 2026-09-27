import { useState } from 'react'

import { AppNotification } from '../../../components/ui/AppNotification'
import { Button } from '../../../components/ui/Button'
import type { ReportContextData, ReportRow } from '../types'
import type { ReportSummaryData } from '../utils/reportSummary'
import {
  buildProductionReportFilename,
  downloadProductionReport,
} from '../pdf/downloadProductionReport'

interface GenerateReportPdfButtonProps {
  context: ReportContextData
  dateFrom: string | null
  dateTo: string | null
  disabled: boolean
  disabledReason: string
  generatedBy: string
  rows: ReportRow[]
  summary: ReportSummaryData
}

export function GenerateReportPdfButton({
  context,
  dateFrom,
  dateTo,
  disabled,
  disabledReason,
  generatedBy,
  rows,
  summary,
}: GenerateReportPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePdf = async () => {
    setError(null)
    setIsGenerating(true)
    try {
      await downloadProductionReport(
        {
          generatedAt: new Date().toISOString(),
          generatedBy,
          context,
          summary,
          rows,
        },
        buildProductionReportFilename(dateFrom, dateTo),
      )
    } catch {
      setError('The Production report PDF could not be generated. Please retry.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      {error ? (
        <AppNotification onDismiss={() => setError(null)} title="PDF generation failed" tone="error">
          <span>{error}</span>
        </AppNotification>
      ) : null}
      <Button
        type="button"
        disabled={disabled}
        isLoading={isGenerating}
        title={disabled ? disabledReason : 'Download the currently applied report as PDF'}
        onClick={() => void generatePdf()}
      >
        Generate PDF
      </Button>
    </>
  )
}
