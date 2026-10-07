import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

interface BomToolbarProps {
  maxLevel: number
  onCollapseAll: () => void
  onExpandAll: () => void
  onExpandLevel: (level: number) => void
  onQueryChange: (query: string) => void
  query: string
}

export function BomToolbar({
  maxLevel,
  onCollapseAll,
  onExpandAll,
  onExpandLevel,
  onQueryChange,
  query,
}: BomToolbarProps) {
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

