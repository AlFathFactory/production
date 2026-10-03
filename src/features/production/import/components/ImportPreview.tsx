import { Fragment, useState } from 'react'

import { Input } from '../../../../components/ui/Input'
import { Select } from '../../../../components/ui/Select'
import { formatQuantity } from '../../utils'
import type {
  NormalizedProductionImportRow,
  ProductionImportField,
  ProductionImportPreview,
  ProductionImportValidationStatus,
} from '../types'

const PREVIEW_ROW_LIMIT = 10

function previewQuantity(value: number | null): string {
  return value === null ? '—' : formatQuantity(value)
}

const EDIT_FIELDS: ReadonlyArray<{
  field: ProductionImportField
  label: string
  type: 'date' | 'number' | 'route' | 'text'
}> = [
  { field: 'article', label: 'Article', type: 'text' },
  { field: 'profile', label: 'Profile', type: 'text' },
  { field: 'routing', label: 'Routing', type: 'route' },
  { field: 'designation', label: 'Designation', type: 'text' },
  { field: 'material', label: 'Material', type: 'text' },
  { field: 'total_quantity', label: 'Total Quantity', type: 'number' },
  { field: 'unit_weight_kg', label: 'Unit Weight', type: 'number' },
  { field: 'cut_qty', label: 'CUT Qty', type: 'number' },
  { field: 'cut_date', label: 'CUT Date', type: 'date' },
  { field: 'out_bend_qty', label: 'Issue Packing Qty', type: 'number' },
  { field: 'out_bend_date', label: 'Issue Packing Date', type: 'date' },
  { field: 'bend_qty', label: 'Receive Packing Qty', type: 'number' },
  { field: 'bend_date', label: 'Receive Packing Date', type: 'date' },
  { field: 'rolling_qty', label: 'Rolling Qty', type: 'number' },
  { field: 'rolling_date', label: 'Rolling Date', type: 'date' },
  { field: 'dispensed_qty', label: 'Dispensed Qty', type: 'number' },
  { field: 'action_date', label: 'Action Date', type: 'date' },
  { field: 'remark', label: 'Remark', type: 'text' },
  { field: 'admin_name', label: 'Admin Name', type: 'text' },
]

function editableValue(row: NormalizedProductionImportRow, field: ProductionImportField): string | number {
  return row[field] ?? ''
}

function displayOriginal(value: string | number | null): string {
  if (value === null || value === '') return 'blank'
  return String(value)
}

interface ImportPreviewProps {
  isValidating: boolean
  onEditRow: (sourceRow: number, field: ProductionImportField, value: string) => void
  preview: ProductionImportPreview
  validationStatus: ProductionImportValidationStatus
}

export function ImportPreview({ isValidating, onEditRow, preview, validationStatus }: ImportPreviewProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const invalidRows = preview.rows.filter((row) => row.errors.length > 0)
  const changedRows = preview.rows.filter((row) => row.errors.length === 0 && row.changedFields.length > 0)
  const priorityRows = [...invalidRows, ...changedRows]
  const priorityRowNumbers = new Set(priorityRows.map((row) => row.row.source_row))
  const validPreviewRows = preview.rows
    .filter((row) => !priorityRowNumbers.has(row.row.source_row))
    .slice(0, Math.max(PREVIEW_ROW_LIMIT - priorityRows.length, 0))
  const visibleRows = priorityRows.length > 0 ? [...priorityRows, ...validPreviewRows] : preview.rows.slice(0, PREVIEW_ROW_LIMIT)
  const errors = preview.rows.flatMap((row) => row.errors.map((error) => ({ error, row: row.row })))
  const summary = [
    ['Header row', preview.headerRow],
    ['Parsed rows', preview.totalRows],
    ['Valid rows', preview.validRows],
    ['Rows with errors', preview.errorRows],
    ['Warnings', preview.warningCount],
  ] as const

  const focusRow = (sourceRow: number) => {
    setEditingRow(sourceRow)
    window.setTimeout(() => {
      const element = document.getElementById(`production-import-row-${sourceRow}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element?.focus({ preventScroll: true })
    }, 0)
  }

  return (
    <section className="production-import-preview" aria-label="Import preview">
      <div className="production-import-summary">
        {summary.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>

      <div className={`production-validation-state production-validation-state--${validationStatus}`} role="status">
        <strong>Backend Validation</strong>
        <span>
          {isValidating
            ? 'Checking every row…'
            : validationStatus === 'passed'
              ? `Validation passed — ${preview.validRows} / ${preview.totalRows} rows valid.`
              : validationStatus === 'failed'
                ? `${preview.errorRows} ${preview.errorRows === 1 ? 'row needs' : 'rows need'} attention.`
                : 'Revalidate after edits before importing.'}
        </span>
      </div>

      {preview.ignoredHeaders.length > 0 ? (
        <p className="production-import-warning" role="status">
          <span dir="auto">Ignored extra columns: {preview.ignoredHeaders.join(', ')}</span>
        </p>
      ) : null}

      {errors.length > 0 ? (
        <section className="production-import-error-list" aria-labelledby="production-import-errors-title">
          <div>
            <h3 id="production-import-errors-title">{preview.errorRows} {preview.errorRows === 1 ? 'row needs' : 'rows need'} attention</h3>
            <p>Fix values here and revalidate, or correct the shown Excel rows in the original file and re-upload it.</p>
          </div>
          <ul>
            {errors.map(({ error, row }, index) => (
              <li key={`${row.source_row}-${error.code ?? error.field}-${index}`}>
                <button type="button" onClick={() => focusRow(row.source_row)}>
                  <strong>Excel Row {row.source_row} — Article {row.article || 'missing'}</strong>
                  <span>{error.message}</span>
                  {error.maximumValue !== undefined && error.maximumValue !== null
                    ? <small>Maximum allowed: {formatQuantity(error.maximumValue)}</small>
                    : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="production-import-preview__count">
        {invalidRows.length > 0
          ? `Showing all ${invalidRows.length} invalid ${invalidRows.length === 1 ? 'row' : 'rows'} first, plus ${validPreviewRows.length} valid preview rows.`
          : `Showing the first ${visibleRows.length} of ${preview.totalRows} rows.`}
      </p>
      <div className="production-import-table-wrap" tabIndex={0} aria-label="Production import preview table. Scroll horizontally to see all columns.">
        <table className="production-import-table">
          <thead>
            <tr>
              <th scope="col">Row</th>
              <th scope="col">Article</th>
              <th scope="col">Profile</th>
              <th scope="col">Routing</th>
              <th scope="col">Designation</th>
              <th scope="col">Material</th>
              <th scope="col">Total Quantity</th>
              <th scope="col">Unit Weight</th>
              <th scope="col">Cut Quantity</th>
              <th scope="col">Out Bend Quantity</th>
              <th scope="col">Bend Quantity</th>
              <th scope="col">Rolling Quantity</th>
              <th scope="col">Dispensed Quantity</th>
              <th scope="col">Remark</th>
              <th scope="col">Status</th>
              <th scope="col">Edit</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ changedFields, errors: rowErrors, originalRow, row, warnings }) => (
              <Fragment key={row.source_row}>
                <tr
                  className={rowErrors.length > 0 ? 'production-import-table__row--error' : ''}
                  id={`production-import-row-${row.source_row}`}
                  tabIndex={-1}
                >
                  <td><strong>{row.source_row}</strong>{changedFields.length > 0 ? <small className="production-import-edited-mark">Edited</small> : null}</td>
                  <td dir="auto">{row.article || '—'}</td>
                  <td dir="auto">{row.profile ?? '—'}</td>
                  <td>{row.routing}</td>
                  <td dir="auto">{row.designation ?? '—'}</td>
                  <td dir="auto">{row.material ?? '—'}</td>
                  <td>{previewQuantity(row.total_quantity)}</td>
                  <td>{previewQuantity(row.unit_weight_kg)}</td>
                  <td>{previewQuantity(row.cut_qty)}</td>
                  <td>{previewQuantity(row.out_bend_qty)}</td>
                  <td>{previewQuantity(row.bend_qty)}</td>
                  <td>{previewQuantity(row.rolling_qty)}</td>
                  <td>{previewQuantity(row.dispensed_qty)}</td>
                  <td dir="auto">{row.remark ?? '—'}</td>
                  <td className="production-import-table__status">
                    {rowErrors.length === 0 && warnings.length === 0 ? <span className="production-import-valid">Valid</span> : null}
                    {rowErrors.map((issue, index) => <span className="production-import-error" key={`${issue.code ?? issue.field}-${index}`}>✕ {issue.message}</span>)}
                    {warnings.map((issue, index) => <span className="production-import-warning-text" key={`${issue.field}-${index}`}>{issue.message}</span>)}
                  </td>
                  <td>
                    <button className="production-import-edit-button" type="button" onClick={() => setEditingRow(editingRow === row.source_row ? null : row.source_row)}>
                      {editingRow === row.source_row ? 'Close' : 'Edit Row'}
                    </button>
                  </td>
                </tr>
                {editingRow === row.source_row ? (
                  <tr className="production-import-editor-row">
                    <td colSpan={16}>
                      <div className="production-import-row-editor">
                        {EDIT_FIELDS.map(({ field, label, type }) => {
                          const isChanged = changedFields.includes(field)
                          const hasError = rowErrors.some((issue) => issue.field === field)
                          return (
                            <label key={field}>
                              <span>{label}</span>
                              {type === 'route' ? (
                                <Select
                                  hasError={hasError}
                                  value={row.routing}
                                  onChange={(event) => onEditRow(row.source_row, field, event.target.value)}
                                >
                                  {['BEND', 'NO BEND', 'ROD', 'ROLLING', 'LADDER', 'OTHER'].map((route) => <option key={route}>{route}</option>)}
                                </Select>
                              ) : (
                                <Input
                                  hasError={hasError}
                                  step={type === 'number' ? 'any' : undefined}
                                  type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                                  value={editableValue(row, field)}
                                  onChange={(event) => onEditRow(row.source_row, field, event.target.value)}
                                />
                              )}
                              {isChanged ? <small>Original: {displayOriginal(originalRow[field])}</small> : null}
                            </label>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
