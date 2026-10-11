import { Button } from '../../../components/ui/Button'
import { CheckboxField } from '../../../components/ui/CheckboxField'
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
  onExpandLevel: (level: number) => void
  onQueryChange: (query: string) => void
  onFiltersChange: (filters: BomToolbarFilters) => void
  query: string
  unmappedDimensionsAvailable: boolean
}

export function BomToolbar({
  filters,
  maxLevel,
  onClearFilters,
  onCollapseAll,
  onExpandAll,
  onExpandLevel,
  onFiltersChange,
  onQueryChange,
  query,
  unmappedDimensionsAvailable,
}: BomToolbarProps) {
  const toggleSet = <T extends string,>(value: Set<T>, item: T): Set<T> => {
    const next = new Set(value)
    if (next.has(item)) next.delete(item)
    else next.add(item)
    return next
  }
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
        <span className="bom-toolbar__label">Filter nodes</span>
        <div className="bom-toolbar__filter-grid">
          <label>
            <span>Level</span>
            <Select aria-label="Filter by level" value={filters.level ?? ''} onChange={(event) => onFiltersChange({ ...filters, level: event.target.value ? Number(event.target.value) : null })}>
              <option value="">All levels</option>
              {Array.from({ length: maxLevel }, (_, index) => index + 1).map((level) => <option key={level} value={level}>{level}</option>)}
            </Select>
          </label>
          <fieldset>
            <legend>Item type</legend>
            {(['assembly', 'part', 'material'] as BomItemType[]).map((itemType) => <CheckboxField key={itemType} checked={filters.itemTypes.has(itemType)} id={`bom-filter-item-${itemType}`} label={itemType[0].toUpperCase() + itemType.slice(1)} onChange={() => onFiltersChange({ ...filters, itemTypes: toggleSet(filters.itemTypes, itemType) })} />)}
          </fieldset>
          <fieldset>
            <legend>Source type</legend>
            {['Eigenfertigung', 'Fremdbezug'].map((sourceType) => <CheckboxField key={sourceType} checked={filters.sourceTypes.has(sourceType)} id={`bom-filter-source-${sourceType}`} label={sourceType} onChange={() => onFiltersChange({ ...filters, sourceTypes: toggleSet(filters.sourceTypes, sourceType) })} />)}
          </fieldset>
          <div className="bom-toolbar__filter-toggles">
            <CheckboxField checked={filters.leafOnly} id="bom-filter-leaves" label="Leaves only" onChange={(event) => onFiltersChange({ ...filters, leafOnly: event.target.checked })} />
            <CheckboxField checked={filters.reusedOnly} id="bom-filter-reused" label="Reused only" onChange={(event) => onFiltersChange({ ...filters, reusedOnly: event.target.checked })} />
            <CheckboxField checked={filters.warningsOnly} id="bom-filter-warnings" label="Warnings only" onChange={(event) => onFiltersChange({ ...filters, warningsOnly: event.target.checked })} />
            <CheckboxField checked={filters.unmappedDimensionsOnly} disabled={!unmappedDimensionsAvailable} id="bom-filter-unmapped-dimensions" label="Unmapped dimensions" onChange={(event) => onFiltersChange({ ...filters, unmappedDimensionsOnly: event.target.checked })} />
          </div>
        </div>
        {hasFilters ? <button className="bom-toolbar__clear-filters" type="button" onClick={onClearFilters}>Clear filters</button> : null}
        {!unmappedDimensionsAvailable ? <small>Dimension coverage is available for the current saved import only.</small> : null}
      </div>
      <div className="bom-toolbar__group bom-toolbar__levels">
        <span className="bom-toolbar__label">Expand to level</span>
        <div className="bom-level-buttons">
          {Array.from({ length: maxLevel }, (_, index) => index + 1).map((level) => (
            <button key={level} type="button" onClick={() => onExpandLevel(level)}>{level}</button>
          ))}
          <button type="button" onClick={onExpandAll}>All</button>
        </div>
      </div>
      <div className="bom-toolbar__actions">
        <Button type="button" variant="secondary" onClick={onCollapseAll}>Collapse All</Button>
        <Button type="button" variant="secondary" onClick={onExpandAll}>Expand All</Button>
      </div>
    </section>
  )
}
