import { BOM_ITEM_TYPE_LABELS, type BomNode, type BomRawValue } from '../types'
import { BomDimensionMapper } from './BomDimensionMapper'

interface BomDetailsProps {
  byCode: Map<string, BomNode[]>
  node: BomNode | null
  nodesById: Map<string, BomNode>
  onClose: () => void
  onNavigate: (node: BomNode) => void
}

const RAW_FIELDS = [
  'Position', 'Menge', 'Menge/kumuliert', 'Komp.Z.Din-Nr', 'Werkstoff', 'Werkstoff_2', 'STL-ME',
  'Durchlaufzeit', 'Bezugsart', 'Artikelstatus', 'Aufnahmedatum', 'Korrekturdatum', 'Länge', 'Breite',
  'Gültigk-KZ', 'Ks.Kenner',
]
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 })

function formatRawValue(value: BomRawValue | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number') return number.format(value)
  return String(value)
}

function pathFor(node: BomNode, nodesById: Map<string, BomNode>): BomNode[] {
  const path = [node]
  let parentId = node.parentId
  while (parentId) {
    const parent = nodesById.get(parentId)
    if (!parent) break
    path.unshift(parent)
    parentId = parent.parentId
  }
  return path
}

export function BomDetails({ byCode, node, nodesById, onClose, onNavigate }: BomDetailsProps) {
  if (!node) {
    return <aside className="bom-details bom-details--empty"><span>Select a row to inspect its calculations and original Excel values.</span></aside>
  }
  const path = pathFor(node, nodesById)
  const occurrences = (byCode.get(node.code) ?? []).filter((occurrence) => occurrence.id !== node.id)
  const rawFields = RAW_FIELDS.map((field) => [field, formatRawValue(node.formattedRaw[field])] as const).filter(([, value]) => value)
  const allRawFields = Object.entries(node.formattedRaw).map(([field, value]) => [field, formatRawValue(value)] as const).filter(([, value]) => value)
  const excelCumulative = formatRawValue(node.formattedRaw['Menge/kumuliert'])
  const hasCumulativeMismatch = node.excelCumulativeQuantity !== null
    && Math.abs(node.excelCumulativeQuantity - node.calculatedCumulativeQuantity) > 0.000001

  return (
    <aside className="bom-details" aria-label={`Details for ${node.code || 'BOM node'}`}>
      <header className="bom-details__header">
        <div><span>Node details</span><strong>{node.code || 'No code'}</strong><p>{node.name || 'No description'}</p></div>
        <button aria-label="Close node details" className="bom-details__close" type="button" onClick={onClose}>×</button>
      </header>
      <div className="bom-details__badges">
        <span className={`bom-type-badge bom-type-badge--${node.itemType}`}>{BOM_ITEM_TYPE_LABELS[node.itemType]}</span>
        {node.sourceType ? <span className="bom-detail-badge">{node.sourceType}</span> : null}
        <span className="bom-detail-badge">Level {node.level}</span>
        <span className="bom-detail-badge">Excel row {node.sourceRow}</span>
        {node.reuseCount > 1 ? <span className="bom-detail-badge">Used {node.reuseCount}× in BOM</span> : null}
      </div>
      <nav className="bom-details__path" aria-label="Hierarchy path">
        {path.map((entry, index) => (
          <span key={entry.id}>
            {index ? <i aria-hidden="true">›</i> : null}
            <button disabled={entry.id === node.id} type="button" onClick={() => onNavigate(entry)}>{entry.code || `Row ${entry.sourceRow}`}</button>
          </span>
        ))}
      </nav>
      {hasCumulativeMismatch ? (
        <div className="bom-details__mismatch" role="note">
          <strong>Cumulative quantity mismatch</strong>
          <span>Excel cumulative: {excelCumulative || '—'} · Calculated cumulative: {number.format(node.calculatedCumulativeQuantity)}</span>
        </div>
      ) : null}
      <section className="bom-details__section">
        <h3>Description dimensions</h3>
        <BomDimensionMapper
          key={node.id}
          code={node.code}
          description={[node.name, node.name2].filter(Boolean).join(' ')}
        />
      </section>
      <section className="bom-details__section">
        <h3>Excel fields</h3>
        <dl className="bom-details__raw">
          {rawFields.length ? rawFields.map(([field, value]) => <div key={field}><dt>{field}</dt><dd>{value}</dd></div>) : <div><dt>Available values</dt><dd>—</dd></div>}
        </dl>
      </section>
      {occurrences.length ? (
        <section className="bom-details__section">
          <h3>Also appears under</h3>
          <div className="bom-details__occurrences">
            {occurrences.map((occurrence) => (
              <button key={occurrence.id} type="button" onClick={() => onNavigate(occurrence)}>
                <span>{occurrence.parentCode || 'Root'}</span><small>Excel row {occurrence.sourceRow} · Level {occurrence.level}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}
      <details className="bom-details__all-raw">
        <summary>View Raw Row ({allRawFields.length} populated fields)</summary>
        <dl className="bom-details__raw">
          {allRawFields.map(([field, value]) => <div key={field}><dt>{field}</dt><dd>{value}</dd></div>)}
        </dl>
      </details>
    </aside>
  )
}
