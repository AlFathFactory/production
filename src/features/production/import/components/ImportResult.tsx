import type { ProductionImportResult as ProductionImportResultData } from '../types'

export function ImportResult({ result }: { result: ProductionImportResultData }) {
  const counts = [
    ['Rows processed', result.rowsProcessed],
    ['Items inserted', result.itemsInserted],
    ['Items updated', result.itemsUpdated],
    ['Stage entries created', result.stageEntriesCreated],
    ['Rows skipped', result.skippedRows],
  ] as const

  return (
    <section className="production-import-result" role="status">
      <span className="production-import-result__mark" aria-hidden="true">✓</span>
      <div>
        <h3>Import completed</h3>
        <dl>{counts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </div>
    </section>
  )
}
