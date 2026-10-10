import { Input } from '../../../components/ui/Input'
import type { BomImport } from '../types/bomDomain.types'

interface BomImportSelectorProps {
  error: string | null
  imports: BomImport[]
  selectedImport?: BomImport | null
  isLoading: boolean
  onRetry: () => void
  onSearchChange: (value: string) => void
  onSelect: (importId: string) => void
  search: string
  selectedImportId: string | null
}

function formatImport(importItem: BomImport): string {
  const state = importItem.status === 'superseded' ? 'superseded' : importItem.status === 'saved' ? 'current' : importItem.status
  return `${importItem.fileName} · v${importItem.versionNumber} · ${importItem.status} · ${state}`
}

export function BomImportSelector({
  error,
  imports,
  selectedImport,
  isLoading,
  onRetry,
  onSearchChange,
  onSelect,
  search,
  selectedImportId,
}: BomImportSelectorProps) {
  return (
    <section className="bom-import-selector" aria-label="Saved BOM imports">
      <div className="bom-import-selector__heading">
        <div>
          <span>Persisted BOMs</span>
          <strong>Open a saved import</strong>
        </div>
        {isLoading ? <small role="status">Loading saved BOMs…</small> : null}
      </div>
      <Input
        aria-label="Search saved BOM imports"
        placeholder="Search file name or root code"
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      {error ? (
        <div className="bom-import-selector__error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRetry}>Retry</button>
        </div>
      ) : null}
      {!isLoading && !error && imports.length === 0 ? <p className="bom-import-selector__empty">No saved BOM imports match this search.</p> : null}
      {imports.length > 0 || selectedImportId ? (
        <select
          aria-label="Saved BOM import"
          className="select"
          value={selectedImportId ?? ''}
          onChange={(event) => onSelect(event.target.value)}
        >
          <option value="">Choose a saved BOM import…</option>
          {selectedImport && !imports.some((item) => item.id === selectedImport.id) ? <option value={selectedImport.id}>{formatImport(selectedImport)}</option> : null}
          {imports.map((importItem) => <option key={importItem.id} value={importItem.id}>{formatImport(importItem)}</option>)}
        </select>
      ) : null}
      {selectedImportId ? (
        <p className="bom-import-selector__selected" role="status">
          {selectedImport?.status === 'saved' || selectedImport?.status === 'superseded'
            ? `Viewing saved import version ${selectedImport.versionNumber}.`
            : selectedImport?.status === 'parsed' ? 'Source attached; structure has not been saved.' : 'Loading import…'}
        </p>
      ) : null}
    </section>
  )
}
