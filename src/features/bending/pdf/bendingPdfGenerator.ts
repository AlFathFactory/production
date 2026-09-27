import { jsPDF } from 'jspdf'

import { getPdfTextOptions, registerPdfFonts, setPdfUnicodeFont } from '../../../pdf/pdfFonts'
import type { BendingDispatchPdfModel, BendingPdfItem, BendingReturnPdfModel } from '../types'

type PdfDocument = InstanceType<typeof jsPDF>

interface TableColumn {
  align?: 'left' | 'right'
  label: string
  value: (item: BendingPdfItem, index: number) => string
  width: number
}

const PAGE_MARGIN = 14
const PAGE_WIDTH = 297
const PAGE_HEIGHT = 210
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2
const TABLE_FONT_SIZE = 7.5
const TABLE_LINE_HEIGHT = 3.6
const MIN_ROW_HEIGHT = 8
const LOGO_SIZE = 18

function displayValue(value: string | null): string {
  return value?.trim() || '-'
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value)
}

function formatWeight(item: BendingPdfItem): string {
  return item.unitWeightKg === null ? '-' : formatNumber(item.quantity * item.unitWeightKg)
}

function addPageHeader(
  doc: PdfDocument,
  title: string,
  referenceLabel: string,
  reference: string,
  logoData?: Uint8Array,
) {
  doc.setFillColor(24, 54, 45)
  doc.rect(0, 0, PAGE_WIDTH, 24, 'F')
  if (logoData) {
    doc.addImage(logoData, 'PNG', PAGE_MARGIN, 3, LOGO_SIZE, LOGO_SIZE, 'company-logo', 'FAST')
  }
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text(title, logoData ? PAGE_MARGIN + LOGO_SIZE + 5 : PAGE_MARGIN, 15)
  doc.setFontSize(8)
  doc.text(`${referenceLabel}: ${reference}`, PAGE_WIDTH - PAGE_MARGIN, 14.5, { align: 'right' })
  doc.setTextColor(31, 41, 38)
}

function addDetails(doc: PdfDocument, details: Array<[string, string | null]>, startY = 31): number {
  const columns = 3
  const cellWidth = CONTENT_WIDTH / columns
  const cellHeight = 14

  details.forEach(([label, value], index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = PAGE_MARGIN + column * cellWidth
    const y = startY + row * cellHeight
    doc.setDrawColor(218, 225, 221)
    doc.setFillColor(247, 249, 248)
    doc.roundedRect(x, y, cellWidth - 2, cellHeight - 2, 1.5, 1.5, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(94, 108, 102)
    doc.text(label.toUpperCase(), x + 3, y + 4.5)
    setPdfUnicodeFont(doc)
    doc.setFontSize(8.5)
    doc.setTextColor(31, 41, 38)
    const displayedValue = displayValue(value)
    const clippedValue = doc.splitTextToSize(displayedValue, cellWidth - 8)[0] ?? '-'
    const options = getPdfTextOptions(displayedValue)
    doc.text(clippedValue, options.align === 'right' ? x + cellWidth - 5 : x + 3, y + 9.5, options)
  })

  return startY + Math.ceil(details.length / columns) * cellHeight + 4
}

function drawTableHeader(doc: PdfDocument, columns: TableColumn[], y: number): number {
  doc.setFillColor(48, 93, 78)
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  let x = PAGE_MARGIN
  for (const column of columns) {
    doc.text(column.label, column.align === 'right' ? x + column.width - 2 : x + 2, y + 5.2, {
      align: column.align ?? 'left',
    })
    x += column.width
  }
  doc.setTextColor(31, 41, 38)
  return y + 8
}

function addItemsTable(
  doc: PdfDocument,
  title: string,
  referenceLabel: string,
  reference: string,
  items: BendingPdfItem[],
  columns: TableColumn[],
  startY: number,
  logoData?: Uint8Array,
): number {
  let y = drawTableHeader(doc, columns, startY)

  items.forEach((item, index) => {
    const cellValues = columns.map((column) => column.value(item, index))
    setPdfUnicodeFont(doc)
    const cellLines = columns.map((column, columnIndex) => (
      doc.splitTextToSize(cellValues[columnIndex], Math.max(2, column.width - 4)) as string[]
    ))
    const lineCount = Math.max(...cellLines.map((lines) => lines.length), 1)
    const rowHeight = Math.max(MIN_ROW_HEIGHT, lineCount * TABLE_LINE_HEIGHT + 3)

    if (y + rowHeight > PAGE_HEIGHT - 17) {
      doc.addPage()
      addPageHeader(doc, title, referenceLabel, reference, logoData)
      y = drawTableHeader(doc, columns, 30)
    }

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 249)
      doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight, 'F')
    }
    doc.setDrawColor(222, 228, 225)
    doc.line(PAGE_MARGIN, y + rowHeight, PAGE_WIDTH - PAGE_MARGIN, y + rowHeight)
    setPdfUnicodeFont(doc)
    doc.setFontSize(TABLE_FONT_SIZE)

    let x = PAGE_MARGIN
    columns.forEach((column, columnIndex) => {
      const options = getPdfTextOptions(cellValues[columnIndex], column.align ?? 'left')
      const textX = options.align === 'right' ? x + column.width - 2 : x + 2
      doc.text(cellLines[columnIndex], textX, y + 5, { ...options, lineHeightFactor: 1.2 })
      x += column.width
    })
    y += rowHeight
  })

  return y
}

function addSummary(
  doc: PdfDocument,
  title: string,
  referenceLabel: string,
  reference: string,
  items: BendingPdfItem[],
  y: number,
  quantityLabel: string,
  logoData?: Uint8Array,
): number {
  if (y + 25 > PAGE_HEIGHT - 13) {
    doc.addPage()
    addPageHeader(doc, title, referenceLabel, reference, logoData)
    y = 31
  } else {
    y += 6
  }

  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0)
  const weightedItems = items.filter((item) => item.unitWeightKg !== null)
  const totalWeight = weightedItems.reduce((total, item) => total + item.quantity * (item.unitWeightKg ?? 0), 0)
  const summary: Array<[string, string]> = [
    ['Item count', String(items.length)],
    [quantityLabel, formatNumber(totalQuantity)],
    ['Estimated total weight', weightedItems.length === 0 ? '-' : `${formatNumber(totalWeight)} kg${weightedItems.length < items.length ? ' *' : ''}`],
  ]

  doc.setFillColor(237, 246, 241)
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 19, 2, 2, 'F')
  summary.forEach(([label, value], index) => {
    const x = PAGE_MARGIN + 5 + index * (CONTENT_WIDTH / 3)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(70, 99, 88)
    doc.text(label.toUpperCase(), x, y + 6)
    setPdfUnicodeFont(doc, 'bold')
    doc.setFontSize(10)
    doc.setTextColor(31, 74, 59)
    doc.text(value, x, y + 13, getPdfTextOptions(value))
  })
  if (weightedItems.length > 0 && weightedItems.length < items.length) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(94, 108, 102)
    doc.text('* Excludes lines without a unit weight.', PAGE_MARGIN, y + 24)
  }

  return y + (weightedItems.length > 0 && weightedItems.length < items.length ? 28 : 23)
}

function addClosingDetails(
  doc: PdfDocument,
  title: string,
  referenceLabel: string,
  reference: string,
  details: Array<[string, string | null]>,
  y: number,
  logoData?: Uint8Array,
): void {
  const detailsHeight = Math.ceil(details.length / 3) * 14 + 4
  if (y + detailsHeight > PAGE_HEIGHT - 13) {
    doc.addPage()
    addPageHeader(doc, title, referenceLabel, reference, logoData)
    y = 31
  }

  addDetails(doc, details, y)
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

function createDocument(): PdfDocument {
  return new jsPDF({ format: 'a4', orientation: 'landscape', unit: 'mm', compress: true })
}

async function loadDispatchLogo(): Promise<Uint8Array> {
  const response = await fetch('/logo.png')
  if (!response.ok) {
    throw new Error(`The PDF logo could not be loaded (${response.status}).`)
  }

  return new Uint8Array(await response.arrayBuffer())
}

export async function generateDispatchPdf(model: BendingDispatchPdfModel): Promise<Blob> {
  const doc = createDocument()
  const [logoData] = await Promise.all([loadDispatchLogo(), registerPdfFonts(doc)])
  addPageHeader(doc, 'BENDING DISPATCH', 'Dispatch Number', model.dispatchNumber, logoData)
  const tableY = addDetails(doc, [
    ['Dispatch Date', model.dispatchDate],
    ['Project', model.project],
    ['Project Number', model.projectNumber],
    ['Lot', model.lot],
    ['Destination', model.destination],
  ])
  const columns: TableColumn[] = [
    { label: '#', value: (_, index) => String(index + 1), width: 9 },
    { label: 'Article', value: (item) => item.article, width: 27 },
    { label: 'Designation', value: (item) => displayValue(item.designation), width: 48 },
    { label: 'Profile', value: (item) => displayValue(item.profile), width: 35 },
    { align: 'right', label: 'Quantity', value: (item) => formatNumber(item.quantity), width: 24 },
    { align: 'right', label: 'Unit Weight', value: (item) => item.unitWeightKg === null ? '-' : formatNumber(item.unitWeightKg), width: 28 },
    { align: 'right', label: 'Total Weight', value: formatWeight, width: 30 },
    { label: 'Remark', value: (item) => displayValue(item.remark ?? null), width: 68 },
  ]
  const endY = addItemsTable(doc, 'BENDING DISPATCH', 'Dispatch Number', model.dispatchNumber, model.items, columns, tableY, logoData)
  const summaryEndY = addSummary(doc, 'BENDING DISPATCH', 'Dispatch Number', model.dispatchNumber, model.items, endY, 'Total quantity', logoData)
  addClosingDetails(doc, 'BENDING DISPATCH', 'Dispatch Number', model.dispatchNumber, [
    ['Dispatch Name', model.dispatchName],
    ['Approval Name', model.approvalName],
  ], summaryEndY, logoData)
  addFooters(doc)
  return doc.output('blob')
}

export async function generateReturnPdf(model: BendingReturnPdfModel): Promise<Blob> {
  const doc = createDocument()
  await registerPdfFonts(doc)
  addPageHeader(doc, 'BENDING RETURN', 'Return Reference', model.returnReference)
  const tableY = addDetails(doc, [
    ['Return Date', model.returnDate],
    ['Original Dispatch Number', model.originalDispatchNumber],
    ['Project', model.project],
    ['Project Number', model.projectNumber],
    ['Lot', model.lot],
    ['Received By', model.receivedByName],
  ])
  const columns: TableColumn[] = [
    { label: '#', value: (_, index) => String(index + 1), width: 11 },
    { label: 'Article', value: (item) => item.article, width: 35 },
    { label: 'Designation', value: (item) => displayValue(item.designation), width: 62 },
    { label: 'Profile', value: (item) => displayValue(item.profile), width: 48 },
    { align: 'right', label: 'Returned Quantity', value: (item) => formatNumber(item.quantity), width: 40 },
    { align: 'right', label: 'Unit Weight', value: (item) => item.unitWeightKg === null ? '-' : formatNumber(item.unitWeightKg), width: 34 },
    { align: 'right', label: 'Total Weight', value: formatWeight, width: 39 },
  ]
  const endY = addItemsTable(doc, 'BENDING RETURN', 'Return Reference', model.returnReference, model.items, columns, tableY)
  addSummary(doc, 'BENDING RETURN', 'Return Reference', model.returnReference, model.items, endY, 'Total returned quantity')
  addFooters(doc)
  return doc.output('blob')
}
