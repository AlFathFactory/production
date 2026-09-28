import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { getPdfTextOptions, registerPdfFonts, setPdfUnicodeFont } from '../../../pdf/pdfFonts'
import { formatQuantity, toFiniteNumber } from '../../production/utils'
import type { ActionQueueRow } from '../types'
import './ActionQueueTable.css'

const PAGE_SIZE = 25
const MAX_FILTER_VALUES = 500
const EXPORT_FILE_DATE = (): string => {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
}

type ActionQueueColumn =
  | 'article'
  | 'designation'
  | 'profile'
  | 'routing'
  | 'total_quantity'
  | 'next_action'
  | 'project'
  | 'last_activity_at'
  | 'cut_total'
  | 'remaining_to_cut'
  | 'out_bend_total'
  | 'waiting_out_bend'
  | 'bend_total'
  | 'waiting_receive_packing'
  | 'rolling_total'
  | 'waiting_rolling'
  | 'warehouse_stock'
  | 'dispensed_total'

type ColumnFilters = Partial<Record<ActionQueueColumn, string[]>>

interface GridOption {
  key: string
  label: string
  columns: readonly ActionQueueColumn[]
}

const GRID_OPTIONS: readonly GridOption[] = [
  { key: 'article', label: 'Article', columns: ['article'] },
  { key: 'designation', label: 'Designation', columns: ['designation'] },
  { key: 'profile', label: 'Profile', columns: ['profile'] },
  { key: 'routing', label: 'Route', columns: ['routing'] },
  { key: 'total_quantity', label: 'Total Quantity', columns: ['total_quantity'] },
  { key: 'cut', label: 'CUT', columns: ['total_quantity', 'cut_total', 'remaining_to_cut'] },
  { key: 'issue_packing', label: 'Issue Packing', columns: ['total_quantity', 'out_bend_total', 'waiting_out_bend'] },
  { key: 'bended', label: 'Receive Packing', columns: ['total_quantity', 'bend_total', 'waiting_receive_packing'] },
  { key: 'rolling', label: 'ROLLING', columns: ['total_quantity', 'rolling_total', 'waiting_rolling'] },
  {
    key: 'dispense',
    label: 'DISPENSE',
    columns: ['total_quantity', 'warehouse_stock', 'dispensed_total'],
  },
  { key: 'next_action', label: 'Next Action', columns: ['next_action'] },
  { key: 'project', label: 'Project / Number / Lot', columns: ['project'] },
  { key: 'last_activity_at', label: 'Last Activity', columns: ['last_activity_at'] },
]

const ALL_COLUMNS: readonly ActionQueueColumn[] = [
  ...new Set(GRID_OPTIONS.flatMap((option) => option.columns)),
]

const COLUMN_LABELS: Record<ActionQueueColumn, string> = {
  article: 'Article',
  designation: 'Designation',
  profile: 'Profile',
  routing: 'Route',
  total_quantity: 'Total Qty',
  next_action: 'Next Action',
  project: 'Project / Number / Lot',
  last_activity_at: 'Last Activity',
  cut_total: 'CUT Total',
  remaining_to_cut: 'Remaining CUT',
  out_bend_total: 'Issue Packing Total',
  waiting_out_bend: 'Waiting Issue Packing',
  bend_total: 'Receive Packing Total',
  waiting_receive_packing: 'Waiting Receive Packing',
  rolling_total: 'ROLLING Total',
  waiting_rolling: 'Waiting Rolling',
  warehouse_stock: 'Warehouse Stock',
  dispensed_total: 'Dispensed Total',
}

const DEFAULT_COLUMNS: readonly ActionQueueColumn[] = [
  'article',
  'designation',
  'profile',
  'routing',
  'total_quantity',
]

const PENDING_COLUMNS: readonly ActionQueueColumn[] = [
  'remaining_to_cut',
  'waiting_out_bend',
  'waiting_receive_packing',
  'waiting_rolling',
  'warehouse_stock',
]

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function remainingQuantityValue(available: number | null, completed: number | null): number {
  return Math.max(0, toFiniteNumber(available) - toFiniteNumber(completed))
}

function pendingQuantity(item: ActionQueueRow, column: ActionQueueColumn): number {
  switch (column) {
    case 'remaining_to_cut':
      return remainingQuantityValue(item.total_quantity, item.cut_total)
    case 'waiting_out_bend':
      return item.routing === 'BEND' ? remainingQuantityValue(item.cut_total, item.out_bend_total) : 0
    case 'waiting_receive_packing':
      return item.routing === 'BEND' ? remainingQuantityValue(item.out_bend_total, item.bend_total) : 0
    case 'waiting_rolling':
      return item.routing === 'ROLLING' ? remainingQuantityValue(item.cut_total, item.rolling_total) : 0
    case 'warehouse_stock':
      return Math.max(0, toFiniteNumber(item.warehouse_stock))
    default:
      return 0
  }
}

function pendingCellClass(value: number): string {
  return value > 0
    ? 'action-queue-table__number action-queue-table__pending'
    : 'action-queue-table__number'
}

const EXPORT_COLUMN_WEIGHTS: Record<ActionQueueColumn, number> = {
  article: 1.2,
  designation: 2,
  profile: 1.5,
  routing: 0.9,
  total_quantity: 1,
  next_action: 1.3,
  project: 2.2,
  last_activity_at: 1.6,
  cut_total: 1,
  remaining_to_cut: 1.1,
  out_bend_total: 1.2,
  waiting_out_bend: 1.3,
  bend_total: 1.2,
  waiting_receive_packing: 1.4,
  rolling_total: 1.1,
  waiting_rolling: 1.2,
  warehouse_stock: 1.2,
  dispensed_total: 1.2,
}

function pdfSafeText(value: string): string {
  const trimmed = value.trim()
  return trimmed.replace(/[–—→]/g, '-').replace(/[×]/g, 'x') || '-'
}

function columnValue(item: ActionQueueRow, column: ActionQueueColumn): string {
  switch (column) {
    case 'article':
      return item.article ?? '—'
    case 'designation':
      return item.designation ?? '—'
    case 'profile':
      return item.profile ?? '—'
    case 'routing':
      return item.routing ?? '—'
    case 'total_quantity':
      return formatQuantity(item.total_quantity)
    case 'next_action':
      return item.next_action ?? '—'
    case 'project':
      return `${item.project_name ?? '—'} / ${item.project_number ?? '—'} / ${item.lot_number ?? '—'}`
    case 'last_activity_at':
      return formatDate(item.last_activity_at)
    case 'cut_total':
      return formatQuantity(item.cut_total)
    case 'remaining_to_cut':
    case 'waiting_out_bend':
    case 'waiting_receive_packing':
    case 'waiting_rolling':
    case 'warehouse_stock':
      if (column === 'waiting_out_bend' || column === 'waiting_receive_packing') {
        if (item.routing !== 'BEND') return '—'
      }
      if (column === 'waiting_rolling' && item.routing !== 'ROLLING') return '—'
      return formatQuantity(pendingQuantity(item, column))
    case 'out_bend_total':
      return formatQuantity(item.out_bend_total)
    case 'bend_total':
      return formatQuantity(item.bend_total)
    case 'rolling_total':
      return formatQuantity(item.rolling_total)
    case 'dispensed_total':
      return formatQuantity(item.dispensed_total)
  }
}

interface ActionQueueTableProps {
  items: ActionQueueRow[]
}

export function ActionQueueTable({ items }: ActionQueueTableProps) {
  const [page, setPage] = useState(1)
  const [selectedColumns, setSelectedColumns] = useState<ActionQueueColumn[]>([...DEFAULT_COLUMNS])
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({})
  const [activeFilterColumn, setActiveFilterColumn] = useState<ActionQueueColumn | null>(null)
  const [filterSearch, setFilterSearch] = useState('')
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const filterPanelRef = useRef<HTMLElement | null>(null)
  const filterSearchRef = useRef<HTMLInputElement | null>(null)

  const visibleColumns = useMemo(() => new Set(selectedColumns), [selectedColumns])
  const isVisible = (column: ActionQueueColumn) => visibleColumns.has(column)
  const visiblePendingColumns = useMemo(() => PENDING_COLUMNS.filter((column) => visibleColumns.has(column)), [visibleColumns])

  const appliedFilters = useMemo(
    () => (Object.entries(columnFilters) as [ActionQueueColumn, string[]][])
      .filter(([, values]) => values.length > 0),
    [columnFilters],
  )

  const filteredItems = useMemo(
    () => items.filter((item) => appliedFilters.every(([column, values]) => (
      values.includes(columnValue(item, column))
    ))),
    [items, appliedFilters],
  )

  const orderedItems = useMemo(() => {
    if (visiblePendingColumns.length === 0) return filteredItems
    return filteredItems
      .map((item, index) => ({ item, index }))
      .sort((first, second) => {
        const firstHasPending = visiblePendingColumns.some((column) => pendingQuantity(first.item, column) > 0)
        const secondHasPending = visiblePendingColumns.some((column) => pendingQuantity(second.item, column) > 0)
        return Number(secondHasPending) - Number(firstHasPending) || first.index - second.index
      })
      .map(({ item }) => item)
  }, [filteredItems, visiblePendingColumns])

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const visibleItems = orderedItems.slice(firstIndex, firstIndex + PAGE_SIZE)
  const usesDefaultColumns = DEFAULT_COLUMNS.length === selectedColumns.length
    && DEFAULT_COLUMNS.every((column) => visibleColumns.has(column))

  // Values for the open filter panel are cascaded through the OTHER active
  // filters, so the list only shows values that can still match. Selected
  // values are always kept visible even if other filters hide them, so the
  // user can deselect them again.
  const activeFilterOptions = useMemo(() => {
    if (!activeFilterColumn) return [] as { value: string; count: number }[]
    const otherFilters = appliedFilters.filter(([column]) => column !== activeFilterColumn)
    const counts = new Map<string, number>()
    for (const item of items) {
      if (!otherFilters.every(([column, values]) => values.includes(columnValue(item, column)))) continue
      const value = columnValue(item, activeFilterColumn)
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
    const selected = new Set(columnFilters[activeFilterColumn] ?? [])
    for (const value of selected) {
      if (!counts.has(value)) counts.set(value, 0)
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((first, second) => first.value.localeCompare(second.value, undefined, { numeric: true }))
  }, [activeFilterColumn, appliedFilters, columnFilters, items])

  const normalizedSearch = filterSearch.trim().toLowerCase()
  const matchingFilterOptions = useMemo(() => (
    normalizedSearch === ''
      ? activeFilterOptions
      : activeFilterOptions.filter(({ value }) => value.toLowerCase().includes(normalizedSearch))
  ), [activeFilterOptions, normalizedSearch])
  const truncatedFilterOptions = matchingFilterOptions.slice(0, MAX_FILTER_VALUES)
  const hiddenFilterOptionCount = Math.max(0, matchingFilterOptions.length - truncatedFilterOptions.length)
  const selectedFilterValues = activeFilterColumn ? columnFilters[activeFilterColumn] ?? [] : []
  const visibleSelectedCount = truncatedFilterOptions.filter(({ value }) => selectedFilterValues.includes(value)).length

  useEffect(() => {
    setPage(1)
  }, [columnFilters, items])

  // Close the filter panel if its column gets hidden via Grid Options.
  useEffect(() => {
    if (activeFilterColumn && !visibleColumns.has(activeFilterColumn)) {
      setActiveFilterColumn(null)
      setFilterSearch('')
    }
  }, [activeFilterColumn, visibleColumns])

  // Drop selected values that no longer exist in the loaded data, otherwise a
  // server refetch can leave a stuck filter that matches nothing.
  useEffect(() => {
    if (items.length === 0) return
    setColumnFilters((current) => {
      const entries = Object.entries(current) as [ActionQueueColumn, string[]][]
      if (entries.length === 0) return current
      let changed = false
      const next: ColumnFilters = {}
      for (const [column, values] of entries) {
        const existing = new Set(items.map((item) => columnValue(item, column)))
        const kept = values.filter((value) => existing.has(value))
        if (kept.length !== values.length) changed = true
        if (kept.length > 0) next[column] = kept
        else if (values.length > 0) changed = true
      }
      return changed ? next : current
    })
  }, [items])

  // Focus the search box when a filter panel opens.
  useEffect(() => {
    if (activeFilterColumn) filterSearchRef.current?.focus()
  }, [activeFilterColumn])

  // Close the filter panel on Escape or outside click.
  useEffect(() => {
    if (!activeFilterColumn) return
    const onPointerDown = (event: PointerEvent) => {
      const panel = filterPanelRef.current
      if (!panel) return
      const target = event.target as Node | null
      // Filter toggle buttons live in the table header, outside the panel.
      if (target instanceof Element && target.closest('.action-queue-column-heading__filter')) return
      if (target && !panel.contains(target)) {
        setActiveFilterColumn(null)
        setFilterSearch('')
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveFilterColumn(null)
        setFilterSearch('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [activeFilterColumn])

  const toggleGridOption = (option: GridOption) => {
    const optionIsVisible = option.columns.every((column) => visibleColumns.has(column))
    const removableColumns = option.columns.length > 1
      ? option.columns.filter((column) => column !== 'total_quantity')
      : option.columns
    const nextColumns = optionIsVisible
      ? selectedColumns.filter((candidate) => !removableColumns.includes(candidate))
      : [...new Set([...selectedColumns, ...option.columns])]

    if (nextColumns.length > 0) setSelectedColumns(nextColumns)
  }

  const openColumnFilter = (column: ActionQueueColumn) => {
    setActiveFilterColumn((current) => current === column ? null : column)
    setFilterSearch('')
  }

  const toggleFilterValue = (column: ActionQueueColumn, value: string) => {
    setColumnFilters((current) => {
      const selectedValues = current[column] ?? []
      const nextValues = selectedValues.includes(value)
        ? selectedValues.filter((candidate) => candidate !== value)
        : [...selectedValues, value]
      const nextFilters = { ...current }
      if (nextValues.length > 0) nextFilters[column] = nextValues
      else delete nextFilters[column]
      return nextFilters
    })
  }

  const clearColumnFilter = (column: ActionQueueColumn) => {
    setColumnFilters((current) => {
      const nextFilters = { ...current }
      delete nextFilters[column]
      return nextFilters
    })
  }

  const setActiveColumnValues = (column: ActionQueueColumn, values: string[]) => {
    setColumnFilters((current) => {
      const nextFilters = { ...current }
      const unique = [...new Set(values)]
      if (unique.length > 0) nextFilters[column] = unique
      else delete nextFilters[column]
      return nextFilters
    })
  }

  const closeColumnFilter = () => {
    setActiveFilterColumn(null)
    setFilterSearch('')
  }

  const exportColumns = useMemo(
    () => ALL_COLUMNS.filter((column) => visibleColumns.has(column)),
    [visibleColumns],
  )

  const buildExportMatrix = (): string[][] => {
    const header = exportColumns.map((column) => COLUMN_LABELS[column])
    const body = orderedItems.map((item) => exportColumns.map((column) => columnValue(item, column)))
    return [header, ...body]
  }

  const handleExportExcel = async () => {
    if (exporting || orderedItems.length === 0 || exportColumns.length === 0) return
    setExporting('excel')
    setExportError(null)
    try {
      const xlsx = await import('xlsx')
      const matrix = buildExportMatrix()
      const sheet = xlsx.utils.aoa_to_sheet(matrix)
      const widths = exportColumns.map((column, columnIndex) => {
        const maxLength = matrix.reduce((max, row) => Math.max(max, (row[columnIndex] ?? '').length), COLUMN_LABELS[column].length)
        return { wch: Math.min(48, Math.max(12, maxLength + 2)) }
      })
      sheet['!cols'] = widths
      const workbook = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(workbook, sheet, 'Action Queue')
      xlsx.writeFile(workbook, `action-queue-${EXPORT_FILE_DATE()}.xlsx`)
    } catch {
      setExportError('Excel export failed. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  const handleExportPdf = async () => {
    if (exporting || orderedItems.length === 0 || exportColumns.length === 0) return
    setExporting('pdf')
    setExportError(null)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ format: 'a4', orientation: 'landscape', unit: 'mm', compress: true })
      await registerPdfFonts(doc)

      const pageWidth = 297
      const pageHeight = 210
      const margin = 10
      const contentWidth = pageWidth - margin * 2
      const contentBottom = pageHeight - 14
      const totalWeight = exportColumns.reduce((sum, column) => sum + EXPORT_COLUMN_WEIGHTS[column], 0)
      const columnWidths = exportColumns.map((column) => Math.max(
        11,
        (EXPORT_COLUMN_WEIGHTS[column] / totalWeight) * contentWidth,
      ))
      const widthScale = contentWidth / columnWidths.reduce((sum, width) => sum + width, 0)
      const scaledWidths = columnWidths.map((width) => width * widthScale)
      const fontSize = exportColumns.length > 10 ? 5.4 : 6.4
      const lineHeight = fontSize * 0.52

      const generatedAt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
      const filterSummary = appliedFilters.length > 0
        ? appliedFilters.map(([column, values]) => `${COLUMN_LABELS[column]}: ${values.join(', ')}`).join(' | ')
        : 'No column filters'

      const drawHeader = (): number => {
        doc.setFillColor(24, 54, 45)
        doc.rect(0, 0, pageWidth, 20, 'F')
        doc.setTextColor(255, 255, 255)
        setPdfUnicodeFont(doc, 'bold')
        doc.setFontSize(14)
        const reportTitle = 'مصنع الفتح FOLLOW UP'
        doc.text(reportTitle, pageWidth / 2, 12.5, { align: 'center' })
        setPdfUnicodeFont(doc, 'bold')
        doc.setFontSize(6.5)
        doc.text(`Generated ${generatedAt} - ${orderedItems.length} items`, pageWidth - margin, 11.5, { align: 'right' })
        doc.setTextColor(31, 41, 38)
        setPdfUnicodeFont(doc, 'bold')
        doc.setFontSize(6.5)
        const summaryLines = doc.splitTextToSize(pdfSafeText(filterSummary), contentWidth) as string[]
        doc.text(summaryLines.slice(0, 2), margin, 24.5)
        let headerY = 24.5 + Math.min(2, summaryLines.length) * 3.4 + 2
        doc.setFillColor(48, 93, 78)
        doc.rect(margin, headerY, contentWidth, 7.5, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(fontSize)
        let x = margin
        exportColumns.forEach((column, index) => {
          const lines = doc.splitTextToSize(COLUMN_LABELS[column], Math.max(2, scaledWidths[index] - 2)) as string[]
          doc.text(lines.slice(0, 2), x + 1, headerY + 3, { lineHeightFactor: 1.05 })
          x += scaledWidths[index]
        })
        doc.setTextColor(31, 41, 38)
        return headerY + 7.5
      }

      let y = drawHeader()
      orderedItems.forEach((item, rowIndex) => {
        const values = exportColumns.map((column) => pdfSafeText(columnValue(item, column)))
        setPdfUnicodeFont(doc, 'bold')
        const cellLines = values.map((value, index) => (
          doc.splitTextToSize(value, Math.max(2, scaledWidths[index] - 2)) as string[]
        ))
        const lines = Math.max(...cellLines.map((entry) => entry.length), 1)
        const rowHeight = Math.max(6, lines * lineHeight + 2.6)
        if (y + rowHeight > contentBottom) {
          doc.addPage()
          y = drawHeader()
        }
        if (rowIndex % 2 === 1) {
          doc.setFillColor(248, 250, 249)
          doc.rect(margin, y, contentWidth, rowHeight, 'F')
        }
        doc.setDrawColor(222, 228, 225)
        doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight)
        setPdfUnicodeFont(doc, 'bold')
        doc.setFontSize(fontSize)
        doc.setTextColor(31, 41, 38)
        let x = margin
        cellLines.forEach((entry, index) => {
          const options = getPdfTextOptions(values[index])
          const textX = options.align === 'right' ? x + scaledWidths[index] - 1 : x + 1
          doc.text(entry, textX, y + 3.4, { ...options, lineHeightFactor: 1.12 })
          x += scaledWidths[index]
        })
        y += rowHeight
      })

      const pageCount = doc.getNumberOfPages()
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page)
        doc.setDrawColor(220, 226, 223)
        doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(105, 116, 111)
        doc.text('Production Control - Action Queue', margin, pageHeight - 5)
        doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 5, { align: 'right' })
      }
      doc.save(`action-queue-${EXPORT_FILE_DATE()}.pdf`)
    } catch {
      setExportError('PDF export failed. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  const renderColumnHeader = (column: ActionQueueColumn) => {
    const selectedCount = columnFilters[column]?.length ?? 0
    const isActive = activeFilterColumn === column
    return (
      <th scope="col">
        <div className="action-queue-column-heading">
          <span>{COLUMN_LABELS[column]}</span>
          <button
            type="button"
            className={selectedCount > 0
              ? 'action-queue-column-heading__filter action-queue-column-heading__filter--active'
              : 'action-queue-column-heading__filter'}
            aria-label={selectedCount > 0
              ? `Filter ${COLUMN_LABELS[column]}, ${selectedCount} selected`
              : `Filter ${COLUMN_LABELS[column]}`}
            aria-expanded={isActive}
            title={selectedCount > 0 ? (columnFilters[column] ?? []).join(', ') : `Filter ${COLUMN_LABELS[column]}`}
            onClick={() => openColumnFilter(column)}
          >
            <span aria-hidden="true">&#9662;</span>
            {selectedCount > 0 ? <strong>{selectedCount}</strong> : null}
          </button>
        </div>
      </th>
    )
  }

  if (items.length === 0) return null

  return (
    <section className="action-queue-results" aria-label="Action queue results">
      <div className="action-queue-toolbar">
        <span className="action-queue-toolbar__count" aria-live="polite">
          {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'} · {exportColumns.length} column{exportColumns.length === 1 ? '' : 's'}
        </span>
        <div className="action-queue-toolbar__actions">
          <Button
            type="button"
            variant="secondary"
            disabled={exporting !== null || orderedItems.length === 0 || exportColumns.length === 0}
            onClick={() => void handleExportExcel()}
          >
            {exporting === 'excel' ? 'Exporting…' : 'Export Excel'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={exporting !== null || orderedItems.length === 0 || exportColumns.length === 0}
            onClick={() => void handleExportPdf()}
          >
            {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </Button>
        </div>
      </div>
      {exportError ? <p className="action-queue-toolbar__error" role="alert">{exportError}</p> : null}
      {appliedFilters.length > 0 ? (
        <div className="action-queue-applied-filters" aria-label="Applied column filters">
          <span>Filtered by:</span>
          {appliedFilters.map(([column, values]) => (
            <button
              key={column}
              type="button"
              title={`${COLUMN_LABELS[column]}: ${values.join(', ')}`}
              onClick={() => clearColumnFilter(column)}
            >
              {COLUMN_LABELS[column]} ({values.length}) <span aria-hidden="true">×</span>
            </button>
          ))}
          <button type="button" className="action-queue-applied-filters__clear" onClick={() => setColumnFilters({})}>
            Clear all
          </button>
        </div>
      ) : null}
      {activeFilterColumn ? (
        <section
          ref={filterPanelRef}
          className="action-queue-column-filter"
          aria-label={`Filter ${COLUMN_LABELS[activeFilterColumn]}`}
        >
          <div className="action-queue-column-filter__header">
            <div>
              <strong>{COLUMN_LABELS[activeFilterColumn]}</strong>
              <span>
                {selectedFilterValues.length > 0 ? `${selectedFilterValues.length} selected` : 'All values'}
                {' · '}
                {matchingFilterOptions.length} of {activeFilterOptions.length} values
              </span>
            </div>
            <button type="button" aria-label="Close column filter" onClick={closeColumnFilter}>×</button>
          </div>
          <input
            ref={filterSearchRef}
            className="input action-queue-column-filter__search"
            type="search"
            value={filterSearch}
            placeholder="Search existing values"
            aria-label={`Search ${COLUMN_LABELS[activeFilterColumn]} values`}
            onChange={(event) => setFilterSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') closeColumnFilter()
            }}
          />
          <div className="action-queue-column-filter__actions">
            <button
              type="button"
              disabled={truncatedFilterOptions.length === 0}
              onClick={() => setActiveColumnValues(
                activeFilterColumn,
                [...selectedFilterValues, ...truncatedFilterOptions.map(({ value }) => value)],
              )}
            >
              Select visible
            </button>
            <button
              type="button"
              disabled={visibleSelectedCount === 0}
              onClick={() => {
                const visible = new Set(truncatedFilterOptions.map(({ value }) => value))
                setActiveColumnValues(
                  activeFilterColumn,
                  selectedFilterValues.filter((value) => !visible.has(value)),
                )
              }}
            >
              Deselect visible
            </button>
            <button
              type="button"
              disabled={selectedFilterValues.length === 0}
              onClick={() => clearColumnFilter(activeFilterColumn)}
            >
              Clear
            </button>
          </div>
          <div className="action-queue-column-filter__values">
            {truncatedFilterOptions.map(({ value, count }) => (
              <label
                key={value}
                className={selectedFilterValues.includes(value)
                  ? 'action-queue-column-filter__value action-queue-column-filter__value--selected'
                  : 'action-queue-column-filter__value'}
                title={value}
              >
                <input
                  type="checkbox"
                  checked={selectedFilterValues.includes(value)}
                  onChange={() => toggleFilterValue(activeFilterColumn, value)}
                />
                <span>{value}</span>
                <em className="action-queue-column-filter__count">{count}</em>
              </label>
            ))}
            {truncatedFilterOptions.length === 0 ? <p>No matching values.</p> : null}
          </div>
          {hiddenFilterOptionCount > 0 ? (
            <p className="action-queue-column-filter__hint">
              Showing first {truncatedFilterOptions.length} values — refine the search to see {hiddenFilterOptionCount} more.
            </p>
          ) : null}
        </section>
      ) : null}
      <div className="action-queue-table-wrap" tabIndex={0} aria-label="Action queue table. Scroll horizontally to view all columns.">
        <table className="action-queue-table">
          <thead>
            <tr>
              {isVisible('article') ? renderColumnHeader('article') : null}
              {isVisible('designation') ? renderColumnHeader('designation') : null}
              {isVisible('profile') ? renderColumnHeader('profile') : null}
              {isVisible('routing') ? renderColumnHeader('routing') : null}
              {isVisible('total_quantity') ? renderColumnHeader('total_quantity') : null}
              {isVisible('cut_total') ? renderColumnHeader('cut_total') : null}
              {isVisible('remaining_to_cut') ? renderColumnHeader('remaining_to_cut') : null}
              {isVisible('out_bend_total') ? renderColumnHeader('out_bend_total') : null}
              {isVisible('waiting_out_bend') ? renderColumnHeader('waiting_out_bend') : null}
              {isVisible('bend_total') ? renderColumnHeader('bend_total') : null}
              {isVisible('waiting_receive_packing') ? renderColumnHeader('waiting_receive_packing') : null}
              {isVisible('rolling_total') ? renderColumnHeader('rolling_total') : null}
              {isVisible('waiting_rolling') ? renderColumnHeader('waiting_rolling') : null}
              {isVisible('warehouse_stock') ? renderColumnHeader('warehouse_stock') : null}
              {isVisible('dispensed_total') ? renderColumnHeader('dispensed_total') : null}
              {isVisible('next_action') ? renderColumnHeader('next_action') : null}
              {isVisible('project') ? renderColumnHeader('project') : null}
              {isVisible('last_activity_at') ? renderColumnHeader('last_activity_at') : null}
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item, index) => (
              <tr key={item.production_item_id ?? `action-queue-row-${firstIndex + index}`}>
                {isVisible('article') ? <td dir="auto"><strong>{item.article}</strong></td> : null}
                {isVisible('designation') ? <td dir="auto">{item.designation ?? '—'}</td> : null}
                {isVisible('profile') ? <td dir="auto">{item.profile ?? '—'}</td> : null}
                {isVisible('routing') ? <td><span className="dashboard-route-badge">{item.routing}</span></td> : null}
                {isVisible('total_quantity') ? <td className="action-queue-table__number">{formatQuantity(item.total_quantity)}</td> : null}
                {isVisible('cut_total') ? <td className="action-queue-table__number">{formatQuantity(item.cut_total)}</td> : null}
                {isVisible('remaining_to_cut') ? (
                  <td className={pendingCellClass(pendingQuantity(item, 'remaining_to_cut'))}>
                    {formatQuantity(pendingQuantity(item, 'remaining_to_cut'))}
                  </td>
                ) : null}
                {isVisible('out_bend_total') ? <td className="action-queue-table__number">{formatQuantity(item.out_bend_total)}</td> : null}
                {isVisible('waiting_out_bend') ? (
                  <td className={pendingCellClass(pendingQuantity(item, 'waiting_out_bend'))}>
                    {item.routing === 'BEND' ? formatQuantity(pendingQuantity(item, 'waiting_out_bend')) : '—'}
                  </td>
                ) : null}
                {isVisible('bend_total') ? <td className="action-queue-table__number">{formatQuantity(item.bend_total)}</td> : null}
                {isVisible('waiting_receive_packing') ? (
                  <td className={pendingCellClass(pendingQuantity(item, 'waiting_receive_packing'))}>
                    {item.routing === 'BEND' ? formatQuantity(pendingQuantity(item, 'waiting_receive_packing')) : '—'}
                  </td>
                ) : null}
                {isVisible('rolling_total') ? <td className="action-queue-table__number">{formatQuantity(item.rolling_total)}</td> : null}
                {isVisible('waiting_rolling') ? (
                  <td className={pendingCellClass(pendingQuantity(item, 'waiting_rolling'))}>
                    {item.routing === 'ROLLING' ? formatQuantity(pendingQuantity(item, 'waiting_rolling')) : '—'}
                  </td>
                ) : null}
                {isVisible('warehouse_stock') ? (
                  <td className={pendingCellClass(pendingQuantity(item, 'warehouse_stock'))}>
                    {formatQuantity(pendingQuantity(item, 'warehouse_stock'))}
                  </td>
                ) : null}
                {isVisible('dispensed_total') ? <td className="action-queue-table__number">{formatQuantity(item.dispensed_total)}</td> : null}
                {isVisible('next_action') ? <td><span className="dashboard-action-badge">{item.next_action}</span></td> : null}
                {isVisible('project') ? (
                  <td>
                    <div>{item.project_name ?? '—'}</div>
                    <small>{item.project_number ?? '—'} / {item.lot_number ?? '—'}</small>
                  </td>
                ) : null}
                {isVisible('last_activity_at') ? <td>{formatDate(item.last_activity_at)}</td> : null}
              </tr>
            ))}
            {visibleItems.length === 0 ? (
              <tr>
                <td className="action-queue-table__empty" colSpan={visibleColumns.size}>
                  No items match the selected column filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <nav className="action-queue-pagination" aria-label="Action queue table pages">
        <span className="action-queue-pagination__count">
          Showing {filteredItems.length > 0 ? firstIndex + 1 : 0}–{Math.min(firstIndex + PAGE_SIZE, filteredItems.length)} of {filteredItems.length} items
        </span>
        <div className="action-queue-pagination__controls">
          <Button type="button" variant="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
            Previous
          </Button>
          <span aria-live="polite">Page {currentPage} of {pageCount}</span>
          <Button type="button" variant="secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
            Next
          </Button>
        </div>
      </nav>
      <details className="dashboard-grid-options">
        <summary>Grid Options</summary>
        <div className="dashboard-grid-options__card">
          <div className="dashboard-grid-options__header">
            <div>
              <h3>Visible columns</h3>
              <p>{visibleColumns.size} of {ALL_COLUMNS.length} columns visible</p>
            </div>
            <div className="dashboard-grid-options__actions">
              <button type="button" onClick={() => setSelectedColumns([...ALL_COLUMNS])}>
                Show all
              </button>
              <button type="button" disabled={usesDefaultColumns} onClick={() => setSelectedColumns([...DEFAULT_COLUMNS])}>
                Reset defaults
              </button>
            </div>
          </div>
          <fieldset className="dashboard-grid-options__list">
            <legend className="sr-only">Choose columns for the dashboard table</legend>
            {GRID_OPTIONS.map((option) => {
              const checked = option.columns.every((column) => visibleColumns.has(column))
              return (
                <label key={option.key}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={checked && option.columns.length === 1 && visibleColumns.size === 1}
                    onChange={() => toggleGridOption(option)}
                  />
                  <span>{option.label}</span>
                </label>
              )
            })}
          </fieldset>
        </div>
      </details>
    </section>
  )
}
