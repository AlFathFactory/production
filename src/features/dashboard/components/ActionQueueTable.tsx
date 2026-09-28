import { useEffect, useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { formatQuantity, toFiniteNumber } from '../../production/utils'
import type { ActionQueueRow } from '../types'
import './ActionQueueTable.css'

const PAGE_SIZE = 25

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

interface ActionQueueTableProps {
  items: ActionQueueRow[]
}

export function ActionQueueTable({ items }: ActionQueueTableProps) {
  const [page, setPage] = useState(1)
  const [selectedColumns, setSelectedColumns] = useState<ActionQueueColumn[]>([...DEFAULT_COLUMNS])
  const visibleColumns = new Set(selectedColumns)
  const isVisible = (column: ActionQueueColumn) => visibleColumns.has(column)
  const visiblePendingColumns = PENDING_COLUMNS.filter(isVisible)
  const orderedItems = visiblePendingColumns.length === 0
    ? items
    : items
        .map((item, index) => ({ item, index }))
        .sort((first, second) => {
          const firstHasPending = visiblePendingColumns.some((column) => pendingQuantity(first.item, column) > 0)
          const secondHasPending = visiblePendingColumns.some((column) => pendingQuantity(second.item, column) > 0)
          return Number(secondHasPending) - Number(firstHasPending) || first.index - second.index
        })
        .map(({ item }) => item)
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const visibleItems = orderedItems.slice(firstIndex, firstIndex + PAGE_SIZE)
  const usesDefaultColumns = DEFAULT_COLUMNS.length === selectedColumns.length
    && DEFAULT_COLUMNS.every((column) => visibleColumns.has(column))

  useEffect(() => {
    setPage(1)
  }, [items, selectedColumns])

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

  if (items.length === 0) return null

  return (
    <section className="action-queue-results" aria-label="Action queue results">
      <div className="action-queue-table-wrap" tabIndex={0} aria-label="Action queue table. Scroll horizontally to view all columns.">
        <table className="action-queue-table">
          <thead>
            <tr>
              {isVisible('article') ? <th scope="col">Article</th> : null}
              {isVisible('designation') ? <th scope="col">Designation</th> : null}
              {isVisible('profile') ? <th scope="col">Profile</th> : null}
              {isVisible('routing') ? <th scope="col">Route</th> : null}
              {isVisible('total_quantity') ? <th scope="col">Total Qty</th> : null}
              {isVisible('cut_total') ? <th scope="col">CUT Total</th> : null}
              {isVisible('remaining_to_cut') ? <th scope="col">Remaining CUT</th> : null}
              {isVisible('out_bend_total') ? <th scope="col">Issue Packing Total</th> : null}
              {isVisible('waiting_out_bend') ? <th scope="col">Waiting Issue Packing</th> : null}
              {isVisible('bend_total') ? <th scope="col">Receive Packing Total</th> : null}
              {isVisible('waiting_receive_packing') ? <th scope="col">Waiting Receive Packing</th> : null}
              {isVisible('rolling_total') ? <th scope="col">ROLLING Total</th> : null}
              {isVisible('waiting_rolling') ? <th scope="col">Waiting Rolling</th> : null}
              {isVisible('warehouse_stock') ? <th scope="col">Warehouse Stock</th> : null}
              {isVisible('dispensed_total') ? <th scope="col">Dispensed Total</th> : null}
              {isVisible('next_action') ? <th scope="col">Next Action</th> : null}
              {isVisible('project') ? <th scope="col">Project / Number / Lot</th> : null}
              {isVisible('last_activity_at') ? <th scope="col">Last Activity</th> : null}
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
          </tbody>
        </table>
      </div>
      <nav className="action-queue-pagination" aria-label="Action queue table pages">
        <span className="action-queue-pagination__count">
          Showing {firstIndex + 1}–{Math.min(firstIndex + PAGE_SIZE, items.length)} of {items.length} items
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
