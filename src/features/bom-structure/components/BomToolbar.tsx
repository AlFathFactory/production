import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import type { BomItemType } from '../types'

export interface BomToolbarFilters {
  itemTypes: Set<BomItemType>
  leafOnly: boolean
  level: number | null
  reusedOnly: boolean
  sourceTypes: Set<string>
  unmappedDimensionsOnly: boolean
  warningsOnly: boolean
}

interface BomToolbarProps {
  filters: BomToolbarFilters
  maxLevel: number
  onClearFilters: () => void
  onCollapseAll: () => void
  onExpandAll: () => void
  onQueryChange: (query: string) => void
  onFiltersChange: (filters: BomToolbarFilters) => void
  query: string
}

export function BomToolbar({
  filters,
  maxLevel,
  onClearFilters,
  onCollapseAll,
  onExpandAll,
  onFiltersChange,
  onQueryChange,
  query,
}: BomToolbarProps) {
  const hasFilters = filters.level !== null || filters.leafOnly || filters.reusedOnly || filters.warningsOnly
    || filters.unmappedDimensionsOnly || filters.itemTypes.size !== 3 || filters.sourceTypes.size !== 2

  return (
    <section className="bom-toolbar" aria-label="BOM structure controls">
      <label className="bom-search">
        <span className="bom-toolbar__label">Search BOM</span>
        <Input
          placeholder="Code, description, material, drawing…"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <div className="bom-toolbar__group bom-toolbar__filters">
        <div className="bom-toolbar__filter-grid">
          <label>
            <span>Level</span>
            <Select aria-label="Filter by level" value={filters.level ?? ''} onChange={(event) => onFiltersChange({ ...filters, level: event.target.value ? Number(event.target.value) : null })}>
              <option value="">All levels</option>
              {Array.from({ length: maxLevel }, (_, index) => index + 1).map((level) => <option key={level} value={level}>{level}</option>)}
            </Select>
          </label>
        </div>
        {hasFilters ? <button className="bom-toolbar__clear-filters" type="button" onClick={onClearFilters}>Clear filters</button> : null}
      </div>
      <div className="bom-toolbar__actions">
        <Button type="button" variant="secondary" onClick={onCollapseAll}>Collapse All</Button>
        <Button type="button" variant="secondary" onClick={onExpandAll}>Expand All</Button>
      </div>
    </section>
  )
}
