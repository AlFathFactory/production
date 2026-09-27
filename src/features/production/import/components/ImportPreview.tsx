import { formatQuantity } from '../../utils'
import type { ProductionImportPreview } from '../types'

const PREVIEW_ROW_LIMIT = 100

function previewQuantity(value: number | null): string {
  return value === null ? '—' : formatQuantity(value)
}

export function ImportPreview({ preview }: { preview: ProductionImportPreview }) {
  const invalidRows = preview.rows.filter((row) => row.errors.length > 0)
  const validPreviewRows = preview.rows
    .filter((row) => row.errors.length === 0)
    .slice(0, Math.max(PREVIEW_ROW_LIMIT - invalidRows.length, 0))
  const visibleRows = invalidRows.length > 0
    ? [...invalidRows, ...validPreviewRows]
    : preview.rows.slice(0, PREVIEW_ROW_LIMIT)
  const summary = [
    ['Header row', preview.headerRow],
    ['Parsed rows', preview.totalRows],
    ['Valid rows', preview.validRows],
    ['Rows with errors', preview.errorRows],
    ['Warnings', preview.warningCount],
  ] as const

  return (
    <section className="production-import-preview" aria-label="Import preview">
      <div className="production-import-summary">
        {summary.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>

      {preview.ignoredHeaders.length > 0 ? (
        <p className="production-import-warning" role="status">
          <span dir="auto">Ignored extra columns: {preview.ignoredHeaders.join(', ')}</span>
        </p>
      ) : null}

      {preview.errorRows > 0 ? (
        <p className="form-error" role="alert">
          Import blocked. Fix the {preview.errorRows} invalid {preview.errorRows === 1 ? 'row' : 'rows'} shown below before importing.
        </p>
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
              <th scope="col">Route</th>
              <th scope="col">T.QTY</th>
              <th scope="col">CUT</th>
              <th scope="col">OUT BEND</th>
              <th scope="col">BEND</th>
              <th scope="col">ROLLING</th>
              <th scope="col">DISPENSE</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ errors, row, warnings }) => (
              <tr className={errors.length > 0 ? 'production-import-table__row--error' : ''} key={row.source_row}>
                <td>{row.source_row}</td>
                <td dir="auto">{row.article || '—'}</td>
                <td dir="auto">{row.profile ?? '—'}</td>
                <td>{row.routing}</td>
                <td>{previewQuantity(row.total_quantity)}</td>
                <td>{previewQuantity(row.cut_qty)}</td>
                <td>{previewQuantity(row.out_bend_qty)}</td>
                <td>{previewQuantity(row.bend_qty)}</td>
                <td>{previewQuantity(row.rolling_qty)}</td>
                <td>{previewQuantity(row.dispensed_qty)}</td>
                <td className="production-import-table__status">
                  {errors.length === 0 && warnings.length === 0 ? <span className="production-import-valid">Valid</span> : null}
                  {errors.map((issue) => <span className="production-import-error" key={`${issue.field}-${issue.message}`}>{issue.message}</span>)}
                  {warnings.map((issue) => <span className="production-import-warning-text" key={`${issue.field}-${issue.message}`}>{issue.message}</span>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
