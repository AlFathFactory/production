import { useEffect, useMemo, useRef, useState } from 'react'

import { ProductionRouteBadge } from '../../production/components/ProductionRouteBadge'
import { reportOperationLabels } from '../constants'
import { useReportPagination } from '../hooks/useReportPagination'
import type { ReportRow } from '../types'
import { formatReportDate, formatReportQuantity, formatReportWeight } from '../utils/reportSummary'
import { ReportsPagination } from './ReportsPagination'

const MAX_FILTER_VALUES = 500

type ReportColumn =
  | 'operation_date'
  | 'article'
  | 'designation'
  | 'profile'
  | 'routing'
  | 'operation'
  | 'dispensed_to'
  | 'article_total_quantity'
  | 'quantity'
  | 'unit_weight_kg'
  | 'operation_weight_kg'
  | 'performed_by'

type ColumnFilters = Partial<Record<ReportColumn, string[]>>

const COLUMN_LABELS: Record<ReportColumn, string> = {
  operation_date: 'Operation Date',
  article: 'Article',
  designation: 'Designation',
  profile: 'Profile',
  routing: 'Routing',
  operation: 'Operation',
  dispensed_to: 'Dispensed To',
  article_total_quantity: 'Total Qty',
  quantity: 'Qty',
  unit_weight_kg: 'Unit Wt. kg',
  operation_weight_kg: 'Operation Wt. kg',
  performed_by: 'Performed By',
}

function columnValue(row: ReportRow, column: ReportColumn): string {
  switch (column) {
    case 'operation_date': return formatReportDate(row.operation_date)
    case 'article': return row.article ?? '—'
    case 'designation': return row.designation ?? '—'
    case 'profile': return row.profile ?? '—'
    case 'routing': return row.routing ?? '—'
    case 'operation': return reportOperationLabels[row.operation]
    case 'dispensed_to': return row.operation === 'DISPENSE' ? row.dispensed_to_name?.trim() || 'Not recorded' : '—'
    case 'article_total_quantity': return formatReportQuantity(row.article_total_quantity)
    case 'quantity': return formatReportQuantity(row.quantity)
    case 'unit_weight_kg': return formatReportWeight(row.unit_weight_kg)
    case 'operation_weight_kg': return formatReportWeight(row.operation_weight_kg)
    case 'performed_by': return row.performed_by_name ?? '—'
  }
}

export function ReportsTable({ rows }: { rows: ReportRow[] }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({})
  const [activeFilterColumn, setActiveFilterColumn] = useState<ReportColumn | null>(null)
  const [filterSearch, setFilterSearch] = useState('')
  const filterPanelRef = useRef<HTMLElement | null>(null)
  const filterSearchRef = useRef<HTMLInputElement | null>(null)

  const appliedFilters = useMemo(
    () => (Object.entries(columnFilters) as [ReportColumn, string[]][])
      .filter(([, values]) => values.length > 0),
    [columnFilters],
  )
  const filteredRows = useMemo(
    () => rows.filter((row) => appliedFilters.every(([column, values]) => (
      values.includes(columnValue(row, column))
    ))),
    [rows, appliedFilters],
  )
  const { currentPage, firstIndex, pageCount, setPage, visibleRows } = useReportPagination(filteredRows)

  // Cascade options through all other filters, while retaining selected values
  // so users can always deselect a value whose current count is zero.
  const activeFilterOptions = useMemo(() => {
    if (!activeFilterColumn) return [] as { value: string; count: number }[]
    const otherFilters = appliedFilters.filter(([column]) => column !== activeFilterColumn)
    const counts = new Map<string, number>()
    for (const row of rows) {
      if (!otherFilters.every(([column, values]) => values.includes(columnValue(row, column)))) continue
      const value = columnValue(row, activeFilterColumn)
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
    for (const value of columnFilters[activeFilterColumn] ?? []) {
      if (!counts.has(value)) counts.set(value, 0)
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((first, second) => first.value.localeCompare(second.value, undefined, { numeric: true }))
  }, [activeFilterColumn, appliedFilters, columnFilters, rows])

  const normalizedSearch = filterSearch.trim().toLowerCase()
  const matchingFilterOptions = useMemo(() => (
    normalizedSearch === ''
      ? activeFilterOptions
      : activeFilterOptions.filter(({ value }) => value.toLowerCase().includes(normalizedSearch))
  ), [activeFilterOptions, normalizedSearch])
  const displayedFilterOptions = matchingFilterOptions.slice(0, MAX_FILTER_VALUES)
  const hiddenFilterOptionCount = Math.max(0, matchingFilterOptions.length - displayedFilterOptions.length)
  const selectedFilterValues = activeFilterColumn ? columnFilters[activeFilterColumn] ?? [] : []
  const visibleSelectedCount = displayedFilterOptions
    .filter(({ value }) => selectedFilterValues.includes(value)).length

  useEffect(() => {
    if (activeFilterColumn) filterSearchRef.current?.focus()
  }, [activeFilterColumn])

  useEffect(() => {
    if (rows.length === 0) return
    setColumnFilters((current) => {
      const entries = Object.entries(current) as [ReportColumn, string[]][]
      if (entries.length === 0) return current
      let changed = false
      const next: ColumnFilters = {}
      for (const [column, values] of entries) {
        const existing = new Set(rows.map((row) => columnValue(row, column)))
        const kept = values.filter((value) => existing.has(value))
        if (kept.length !== values.length) changed = true
        if (kept.length > 0) next[column] = kept
      }
      return changed ? next : current
    })
  }, [rows])

  useEffect(() => {
    if (!activeFilterColumn) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (target instanceof Element && target.closest('.reports-column-heading__filter')) return
      if (target && !filterPanelRef.current?.contains(target)) {
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

  const setColumnValues = (column: ReportColumn, values: string[]) => {
    setColumnFilters((current) => {
      const next = { ...current }
      const unique = [...new Set(values)]
      if (unique.length > 0) next[column] = unique
      else delete next[column]
      return next
    })
  }

  const toggleFilterValue = (column: ReportColumn, value: string) => {
    const selected = columnFilters[column] ?? []
    setColumnValues(column, selected.includes(value)
      ? selected.filter((candidate) => candidate !== value)
      : [...selected, value])
  }

  const closeColumnFilter = () => {
    setActiveFilterColumn(null)
    setFilterSearch('')
  }

  const renderColumnHeader = (column: ReportColumn, numeric = false) => {
    const selectedCount = columnFilters[column]?.length ?? 0
    return (
      <th scope="col" className={numeric ? 'reports-table__number' : undefined}>
        <div className="reports-column-heading">
          <span>{COLUMN_LABELS[column]}</span>
          <button
            type="button"
            className={selectedCount > 0
              ? 'reports-column-heading__filter reports-column-heading__filter--active'
              : 'reports-column-heading__filter'}
            aria-label={selectedCount > 0
              ? `Filter ${COLUMN_LABELS[column]}, ${selectedCount} selected`
              : `Filter ${COLUMN_LABELS[column]}`}
            aria-expanded={activeFilterColumn === column}
            title={selectedCount > 0 ? (columnFilters[column] ?? []).join(', ') : `Filter ${COLUMN_LABELS[column]}`}
            onClick={() => {
              setActiveFilterColumn((current) => current === column ? null : column)
              setFilterSearch('')
            }}
          >
            <span aria-hidden="true">&#9662;</span>
            {selectedCount > 0 ? <strong>{selectedCount}</strong> : null}
          </button>
        </div>
      </th>
    )
  }

  return (
    <>
      {appliedFilters.length > 0 ? (
        <div className="reports-applied-filters" aria-label="Applied column filters">
          <span>Filtered by:</span>
          {appliedFilters.map(([column, values]) => (
            <button
              key={column}
              type="button"
              title={`${COLUMN_LABELS[column]}: ${values.join(', ')}`}
              onClick={() => setColumnValues(column, [])}
            >
              {COLUMN_LABELS[column]} ({values.length}) <span aria-hidden="true">×</span>
            </button>
          ))}
          <button
            type="button"
            className="reports-applied-filters__clear"
            onClick={() => setColumnFilters({})}
          >
            Clear all
          </button>
        </div>
      ) : null}
      {activeFilterColumn ? (
        <section
          ref={filterPanelRef}
          className="reports-column-filter"
          aria-label={`Filter ${COLUMN_LABELS[activeFilterColumn]}`}
        >
          <div className="reports-column-filter__header">
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
            className="input reports-column-filter__search"
            type="search"
            value={filterSearch}
            placeholder="Search existing values"
            aria-label={`Search ${COLUMN_LABELS[activeFilterColumn]} values`}
            onChange={(event) => setFilterSearch(event.target.value)}
          />
          <div className="reports-column-filter__actions">
            <button
              type="button"
              disabled={displayedFilterOptions.length === 0}
              onClick={() => setColumnValues(
                activeFilterColumn,
                [...selectedFilterValues, ...displayedFilterOptions.map(({ value }) => value)],
              )}
            >
              Select visible
            </button>
            <button
              type="button"
              disabled={visibleSelectedCount === 0}
              onClick={() => {
                const visibleValues = new Set(displayedFilterOptions.map(({ value }) => value))
                setColumnValues(
                  activeFilterColumn,
                  selectedFilterValues.filter((value) => !visibleValues.has(value)),
                )
              }}
            >
              Deselect visible
            </button>
            <button
              type="button"
              disabled={selectedFilterValues.length === 0}
              onClick={() => setColumnValues(activeFilterColumn, [])}
            >
              Clear
            </button>
          </div>
          <div className="reports-column-filter__values">
            {displayedFilterOptions.map(({ value, count }) => (
              <label
                key={value}
                className={selectedFilterValues.includes(value)
                  ? 'reports-column-filter__value reports-column-filter__value--selected'
                  : 'reports-column-filter__value'}
                title={value}
              >
                <input
                  type="checkbox"
                  checked={selectedFilterValues.includes(value)}
                  onChange={() => toggleFilterValue(activeFilterColumn, value)}
                />
                <span>{value}</span>
                <em className="reports-column-filter__count">{count}</em>
              </label>
            ))}
            {displayedFilterOptions.length === 0 ? <p>No matching values.</p> : null}
          </div>
          {hiddenFilterOptionCount > 0 ? (
            <p className="reports-column-filter__hint">
              Showing first {displayedFilterOptions.length} values — refine the search to see {hiddenFilterOptionCount} more.
            </p>
          ) : null}
        </section>
      ) : null}
      <div className="reports-table-wrap" tabIndex={0} aria-label="Production operations report. Scroll horizontally to view all columns.">
        <table className="reports-table">
          <thead>
            <tr>
              {renderColumnHeader('operation_date')}
              {renderColumnHeader('article')}
              {renderColumnHeader('designation')}
              {renderColumnHeader('profile')}
              {renderColumnHeader('routing')}
              {renderColumnHeader('operation')}
              {renderColumnHeader('dispensed_to')}
              {renderColumnHeader('article_total_quantity', true)}
              {renderColumnHeader('quantity', true)}
              {renderColumnHeader('unit_weight_kg', true)}
              {renderColumnHeader('operation_weight_kg', true)}
              {renderColumnHeader('performed_by')}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={row.stage_entry_id ?? `${row.operation_date}-${row.article}-${firstIndex + index}`}>
                <td>{columnValue(row, 'operation_date')}</td>
                <td dir="auto">{columnValue(row, 'article')}</td>
                <td className="reports-table__designation" dir="auto">{columnValue(row, 'designation')}</td>
                <td dir="auto">{columnValue(row, 'profile')}</td>
                <td><ProductionRouteBadge route={row.routing} /></td>
                <td><span className="reports-operation-badge">{columnValue(row, 'operation')}</span></td>
                <td dir="auto">{columnValue(row, 'dispensed_to')}</td>
                <td className="reports-table__number">{columnValue(row, 'article_total_quantity')}</td>
                <td className="reports-table__number">{columnValue(row, 'quantity')}</td>
                <td className="reports-table__number">{columnValue(row, 'unit_weight_kg')}</td>
                <td className="reports-table__number">{columnValue(row, 'operation_weight_kg')}</td>
                <td dir="auto">{columnValue(row, 'performed_by')}</td>
              </tr>
            ))}
            {visibleRows.length === 0 ? (
              <tr>
                <td className="reports-table__empty" colSpan={Object.keys(COLUMN_LABELS).length}>
                  No operations match the selected column filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <ReportsPagination
        currentPage={currentPage}
        firstIndex={firstIndex}
        itemLabel={filteredRows.length === 1 ? 'operation' : 'operations'}
        pageCount={pageCount}
        totalItems={filteredRows.length}
        onPageChange={setPage}
      />
    </>
  )
}
