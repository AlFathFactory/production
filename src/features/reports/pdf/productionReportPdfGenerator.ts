import { jsPDF } from 'jspdf'

import { reportOperationLabels } from '../constants'
import type { ReportRow } from '../types'
import {
  formatReportCount,
  formatReportDate,
  formatReportQuantity,
  formatReportWeight,
  formatReportWeightKg,
} from '../utils/reportSummary'
import type { ProductionReportPdfModel } from './reportPdfModel'

type PdfDocument = InstanceType<typeof jsPDF>

interface TableColumn {
  align?: 'left' | 'right'
  label: string
  value: (row: ReportRow) => string
  width: number
}

const PAGE_WIDTH = 297
const PAGE_HEIGHT = 210
const PAGE_MARGIN = 10
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2
const CONTENT_BOTTOM = PAGE_HEIGHT - 15
const TABLE_FONT_SIZE = 5.8
const TABLE_LINE_HEIGHT = 2.8
const MIN_ROW_HEIGHT = 6.5

function pdfText(value: string | null | undefined): string {
  return value?.trim().replace(/[\u2013\u2014\u2192]/g, '-') || '-'
}

function formatGeneratedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function addPageHeader(doc: PdfDocument, model: ProductionReportPdfModel): void {
  doc.setFillColor(24, 54, 45)
  doc.rect(0, 0, PAGE_WIDTH, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('PRODUCTION OPERATIONS REPORT', PAGE_MARGIN, 13.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(pdfText(model.context.period), PAGE_WIDTH - PAGE_MARGIN, 13, { align: 'right' })
  doc.setTextColor(31, 41, 38)
}

function addSectionTitle(doc: PdfDocument, title: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(31, 74, 59)
  doc.text(title.toUpperCase(), PAGE_MARGIN, y + 4)
  doc.setDrawColor(176, 198, 190)
  doc.line(PAGE_MARGIN, y + 6, PAGE_WIDTH - PAGE_MARGIN, y + 6)
  return y + 10
}

function addInfoGrid(
  doc: PdfDocument,
  details: Array<[string, string]>,
  startY: number,
): number {
  const columns = 4
  const gap = 1.5
  const cellWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns
  let y = startY

  for (let index = 0; index < details.length; index += columns) {
    const row = details.slice(index, index + columns)
    const values = row.map(([, value]) => (
      doc.splitTextToSize(pdfText(value), cellWidth - 6) as string[]
    ))
    const lineCount = Math.max(...values.map((lines) => lines.length), 1)
    const rowHeight = Math.max(13, 8 + lineCount * 3)

    row.forEach(([label], column) => {
      const x = PAGE_MARGIN + column * (cellWidth + gap)
      doc.setDrawColor(218, 225, 221)
      doc.setFillColor(247, 249, 248)
      doc.roundedRect(x, y, cellWidth, rowHeight - 1.5, 1.3, 1.3, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(5.8)
      doc.setTextColor(94, 108, 102)
      doc.text(label.toUpperCase(), x + 3, y + 4.2)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.2)
      doc.setTextColor(31, 41, 38)
      doc.text(values[column], x + 3, y + 8.5, { lineHeightFactor: 1.15 })
    })
    y += rowHeight
  }

  return y + 2
}

function addSummary(doc: PdfDocument, model: ProductionReportPdfModel, startY: number): number {
  const gap = 2
  const cardWidth = (CONTENT_WIDTH - gap * 2) / 3
  const items: Array<[string, string]> = [
    ['Total Operations', formatReportCount(model.summary.operations)],
    ['Total Quantity', formatReportQuantity(model.summary.quantity)],
    ['Total Weight', formatReportWeightKg(model.summary.weightKg)],
  ]

  items.forEach(([label, value], index) => {
    const x = PAGE_MARGIN + index * (cardWidth + gap)
    doc.setDrawColor(202, 218, 211)
    doc.setFillColor(237, 246, 241)
    doc.roundedRect(x, startY, cardWidth, 15, 1.5, 1.5, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(70, 99, 88)
    doc.text(label.toUpperCase(), x + 4, startY + 5)
    doc.setFontSize(10)
    doc.setTextColor(31, 74, 59)
    doc.text(pdfText(value), x + 4, startY + 11.5)
  })

  return startY + 19
}

function addBreakdown(doc: PdfDocument, model: ProductionReportPdfModel, startY: number): number {
  const widths = [82, 55, 65, 75]
  const labels = ['Operation', 'Operations', 'Quantity', 'Weight']
  let y = startY

  doc.setFillColor(48, 93, 78)
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  let x = PAGE_MARGIN
  labels.forEach((label, index) => {
    const align = index === 0 ? 'left' : 'right'
    doc.text(label, align === 'left' ? x + 2.5 : x + widths[index] - 2.5, y + 4.7, { align })
    x += widths[index]
  })
  y += 7

  model.summary.breakdown.forEach((item, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 249)
      doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 6.5, 'F')
    }
    doc.setDrawColor(222, 228, 225)
    doc.line(PAGE_MARGIN, y + 6.5, PAGE_WIDTH - PAGE_MARGIN, y + 6.5)
    const values = [
      reportOperationLabels[item.operation],
      formatReportCount(item.operations),
      formatReportQuantity(item.quantity),
      formatReportWeightKg(item.weightKg),
    ]
    doc.setFont('helvetica', index === 0 ? 'bold' : 'normal')
    doc.setFontSize(6.7)
    doc.setTextColor(31, 41, 38)
    x = PAGE_MARGIN
    values.forEach((value, valueIndex) => {
      const align = valueIndex === 0 ? 'left' : 'right'
      doc.text(pdfText(value), align === 'left' ? x + 2.5 : x + widths[valueIndex] - 2.5, y + 4.5, { align })
      x += widths[valueIndex]
    })
    y += 6.5
  })

  return y + 3
}

function drawTableHeader(doc: PdfDocument, columns: TableColumn[], y: number): number {
  const height = 9
  doc.setFillColor(48, 93, 78)
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, height, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.5)

  let x = PAGE_MARGIN
  for (const column of columns) {
    const lines = doc.splitTextToSize(column.label, column.width - 2.4) as string[]
    const textX = column.align === 'right' ? x + column.width - 1.2 : x + 1.2
    doc.text(lines, textX, y + 3.2, { align: column.align ?? 'left', lineHeightFactor: 1.05 })
    x += column.width
  }
  doc.setTextColor(31, 41, 38)
  return y + height
}

function addOperationsTable(
  doc: PdfDocument,
  model: ProductionReportPdfModel,
  startY: number,
): void {
  const columns: TableColumn[] = [
    { label: 'Operation Date', value: (row) => formatReportDate(row.operation_date), width: 20 },
    { label: 'Article', value: (row) => pdfText(row.article), width: 25 },
    { label: 'Designation', value: (row) => pdfText(row.designation), width: 60 },
    { label: 'Profile', value: (row) => pdfText(row.profile), width: 38 },
    { label: 'Routing', value: (row) => pdfText(row.routing), width: 18 },
    { label: 'Operation', value: (row) => reportOperationLabels[row.operation], width: 27 },
    { align: 'right', label: 'Qty', value: (row) => formatReportQuantity(row.quantity), width: 17 },
    { align: 'right', label: 'Unit Wt. kg', value: (row) => formatReportWeight(row.unit_weight_kg), width: 20 },
    { align: 'right', label: 'Operation Wt. kg', value: (row) => formatReportWeight(row.operation_weight_kg), width: 23 },
    { label: 'Performed By', value: (row) => pdfText(row.performed_by_name), width: 29 },
  ]
  let y = startY

  if (y + 16 > CONTENT_BOTTOM) {
    doc.addPage()
    addPageHeader(doc, model)
    y = 28
  }
  y = drawTableHeader(doc, columns, y)

  model.rows.forEach((row, rowIndex) => {
    const cellLines = columns.map((column) => (
      doc.splitTextToSize(pdfText(column.value(row)), Math.max(2, column.width - 2.4)) as string[]
    ))
    const lineCount = Math.max(...cellLines.map((lines) => lines.length), 1)
    const rowHeight = Math.max(MIN_ROW_HEIGHT, lineCount * TABLE_LINE_HEIGHT + 2.5)

    if (y + rowHeight > CONTENT_BOTTOM) {
      doc.addPage()
      addPageHeader(doc, model)
      y = drawTableHeader(doc, columns, 28)
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 250, 249)
      doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight, 'F')
    }
    doc.setDrawColor(222, 228, 225)
    doc.line(PAGE_MARGIN, y + rowHeight, PAGE_WIDTH - PAGE_MARGIN, y + rowHeight)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(TABLE_FONT_SIZE)
    doc.setTextColor(31, 41, 38)

    let x = PAGE_MARGIN
    columns.forEach((column, columnIndex) => {
      const textX = column.align === 'right' ? x + column.width - 1.2 : x + 1.2
      doc.text(cellLines[columnIndex], textX, y + 3.5, {
        align: column.align ?? 'left',
        lineHeightFactor: 1.15,
      })
      x += column.width
    })
    y += rowHeight
  })
}

function addFooters(doc: PdfDocument): void {
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(220, 226, 223)
    doc.line(PAGE_MARGIN, PAGE_HEIGHT - 10, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(105, 116, 111)
    doc.text('Production Control', PAGE_MARGIN, PAGE_HEIGHT - 5.5)
    doc.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 5.5, { align: 'right' })
  }
}

export function generateProductionReportPdf(model: ProductionReportPdfModel): Blob {
  const doc = new jsPDF({ format: 'a4', orientation: 'landscape', unit: 'mm', compress: true })
  addPageHeader(doc, model)

  let y = addSectionTitle(doc, 'Report Context', 27)
  const contextDetails: Array<[string, string]> = [
    ['Generated Date / Time', formatGeneratedAt(model.generatedAt)],
    ['Generated By', model.generatedBy],
    ['Period', model.context.period],
    ['Project', model.context.project],
    ['Project Number', model.context.projectNumber],
    ['Lot', model.context.lot],
    ['Selected Operations', model.context.operations],
  ]
  if (model.context.routing) contextDetails.push(['Routing', model.context.routing])
  if (model.context.performedBy) contextDetails.push(['Performed By', model.context.performedBy])
  if (model.context.searchText) contextDetails.push(['Search Text', model.context.searchText])
  y = addInfoGrid(doc, contextDetails, y)

  y = addSectionTitle(doc, 'Summary', y)
  y = addSummary(doc, model, y)

  y = addSectionTitle(doc, 'Operation Breakdown', y)
  y = addBreakdown(doc, model, y)

  y = addSectionTitle(doc, 'Detailed Operations', y)
  addOperationsTable(doc, model, y)
  addFooters(doc)
  return doc.output('blob')
}
