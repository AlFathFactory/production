import { FormField } from '../../../../components/ui/FormField'
import { Select } from '../../../../components/ui/Select'
import { PRODUCTION_IMPORT_FIELDS } from '../productionColumnMapping'
import type {
  ProductionImportField,
  ProductionImportFieldDefinition,
  ProductionImportMapping,
  ProductionSourceColumn,
} from '../types'

interface ColumnMappingStepProps {
  headerRow: number
  headerRowOptions: number[]
  mapping: ProductionImportMapping
  missingRequiredFields: ProductionImportFieldDefinition[]
  onHeaderRowChange: (row: number) => void
  onMappingChange: (columnIndex: number, field: ProductionImportField | null) => void
  sourceColumns: ProductionSourceColumn[]
}

export function ColumnMappingStep({
  headerRow,
  headerRowOptions,
  mapping,
  missingRequiredFields,
  onHeaderRowChange,
  onMappingChange,
  sourceColumns,
}: ColumnMappingStepProps) {
  const mappedFields = new Set(Object.values(mapping).filter((field): field is ProductionImportField => field !== null))

  return (
    <section className="production-column-mapping" aria-labelledby="production-column-mapping-title">
      <div className="production-column-mapping__header">
        <div>
          <h3 id="production-column-mapping-title">Map Excel columns</h3>
          <p>Review the detected header and choose where each source column belongs.</p>
        </div>
        <FormField label="Header Row" htmlFor="production-import-header-row">
          <Select
            id="production-import-header-row"
            value={headerRow}
            onChange={(event) => onHeaderRowChange(Number(event.target.value))}
          >
            {headerRowOptions.map((row) => <option key={row} value={row}>Row {row}</option>)}
          </Select>
        </FormField>
      </div>

      <div className="production-mapping-table-wrap" tabIndex={0} aria-label="Excel column mapping table">
        <table className="production-mapping-table">
          <thead>
            <tr>
              <th scope="col">Excel Column</th>
              <th scope="col">Sample Data</th>
              <th scope="col">Map To</th>
            </tr>
          </thead>
          <tbody>
            {sourceColumns.map((column) => {
              const selectedField = mapping[column.index] ?? null
              return (
                <tr className={column.isBlank ? 'production-mapping-table__blank' : ''} key={column.index}>
                  <td>
                    <span className="production-column-letter">{column.letter}</span>
                    <strong dir="auto">{column.header || 'Blank header'}</strong>
                    {column.isBlank ? <small>Blank / unused</small> : null}
                  </td>
                  <td>
                    {column.samples.length > 0
                      ? <ul>{column.samples.map((sample) => <li dir="auto" key={sample}>{sample}</li>)}</ul>
                      : <span className="production-mapping-empty">No values found</span>}
                  </td>
                  <td>
                    <Select
                      aria-label={`Map Excel column ${column.header || column.letter}`}
                      value={selectedField ?? ''}
                      onChange={(event) => onMappingChange(
                        column.index,
                        event.target.value ? event.target.value as ProductionImportField : null,
                      )}
                    >
                      <option value="">Ignore / Discard</option>
                      {PRODUCTION_IMPORT_FIELDS.map((field) => (
                        <option
                          disabled={mappedFields.has(field.key) && selectedField !== field.key}
                          key={field.key}
                          value={field.key}
                        >
                          {field.label} ({field.required ? 'Required' : 'Optional'})
                        </option>
                      ))}
                    </Select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {missingRequiredFields.length > 0 ? (
        <div className="production-mapping-validation" role="alert">
          <strong>Missing Required Mappings</strong>
          <ul>{missingRequiredFields.map((field) => <li key={field.key}>{field.label}</li>)}</ul>
        </div>
      ) : (
        <p className="production-mapping-valid" role="status">All required fields are mapped.</p>
      )}

      <div className="production-mapping-summary">
        <h4>Excel → Production</h4>
        <ul>
          {sourceColumns.map((column) => {
            const field = PRODUCTION_IMPORT_FIELDS.find((candidate) => candidate.key === mapping[column.index])
            return (
              <li key={column.index}>
                <span dir="auto">{column.header || `Column ${column.letter}`}</span>
                <span aria-hidden="true">→</span>
                <strong>{field?.label ?? 'Ignored'}</strong>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
