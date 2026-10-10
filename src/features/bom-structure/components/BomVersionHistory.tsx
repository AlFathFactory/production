import type { BomImport } from '../types/bomDomain.types'

interface Props {
  currentId: string | null
  error: string | null
  imports: BomImport[]
  isLoading: boolean
  onRetry: () => void
  onSelect: (id: string) => void
  selectedId: string
}

const date = (value: Date | null) => value ? value.toLocaleString() : '—'

export function BomVersionHistory({ currentId, error, imports, isLoading, onRetry, onSelect, selectedId }: Props) {
  return <section className="bom-version-history" aria-label="BOM version history">
    <h2>Version history</h2>
    {isLoading ? <p role="status">Loading versions…</p> : null}
    {error ? <p role="alert">{error} <button type="button" onClick={onRetry}>Retry</button></p> : null}
    {!isLoading && !error ? <div className="bom-version-history__scroll"><table>
      <thead><tr><th>Version</th><th>Status</th><th>File</th><th>Created By</th><th>Created At</th><th>Activated At</th><th>Superseded By</th><th>View</th></tr></thead>
      <tbody>{imports.map((item) => <tr key={item.id}>
        <td>v{item.versionNumber}{item.id === currentId ? ' · current' : ''}</td>
        <td>{item.status}</td><td>{item.sourceFileName ?? item.fileName}</td>
        <td title={item.createdBy}>{item.createdByName ?? item.createdBy}</td><td>{date(item.createdAt)}</td><td>{date(item.activatedAt)}</td>
        <td>{item.supersededByImportId ? `v${imports.find((entry) => entry.id === item.supersededByImportId)?.versionNumber ?? '?'}` : '—'}</td>
        <td><button disabled={item.id === selectedId} type="button" onClick={() => onSelect(item.id)}>{item.id === selectedId ? 'Viewing' : 'View'}</button></td>
      </tr>)}</tbody>
    </table></div> : null}
    <p>Superseded versions are read-only. A parsed candidate is not the production source.</p>
  </section>
}
