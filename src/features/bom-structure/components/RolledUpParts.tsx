import { useEffect, useState } from 'react'

import { Button } from '../../../components/ui/Button'
import type { RolledUpBomPart } from '../types'

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 })
const PAGE_SIZE = 25

export function RolledUpParts({ parts, persisted = false }: { parts: RolledUpBomPart[]; persisted?: boolean }) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(parts.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const visibleParts = parts.slice(firstIndex, firstIndex + PAGE_SIZE)

  useEffect(() => setPage(1), [parts])

  return (
    <section className="bom-rollup" aria-label="Rolled-up leaf parts">
      <div className="bom-rollup__intro">
        <div><h2>Leaf Parts</h2><p>{persisted ? 'Saved leaf occurrences grouped by the backend view.' : 'Leaf occurrences grouped by component code. Preview only.'}</p></div>
        <strong>{parts.length.toLocaleString('en-US')} unique leaves</strong>
      </div>
      <div className="bom-rollup__table-wrap">
        <table className="bom-rollup__table">
          <thead><tr><th>Code</th><th>Description</th><th>Material</th><th>Total Quantity</th><th>Unit Weight</th><th>Total Weight</th></tr></thead>
          <tbody>
            {visibleParts.map((part, index) => (
              <tr key={`${part.code}-${firstIndex + index}`}>
                <td><strong>{part.code || '—'}</strong></td><td>{part.description || '—'}</td><td>{part.material || '—'}</td>
                <td className="bom-number">{number.format(part.totalQuantity)}</td>
                <td className="bom-number">{part.unitWeightKg === null ? '—' : `${number.format(part.unitWeightKg)} kg`}</td>
                <td className="bom-number">{number.format(part.totalWeightKg)} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav className="bom-rollup__pagination" aria-label="Rolled-up parts pages">
        <span>Showing {parts.length ? firstIndex + 1 : 0}–{Math.min(firstIndex + PAGE_SIZE, parts.length)} of {parts.length} parts</span>
        <div className="bom-rollup__pagination-controls">
          <Button type="button" variant="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
          <span aria-live="polite">Page {currentPage} of {pageCount}</span>
          <Button type="button" variant="secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button>
        </div>
      </nav>
    </section>
  )
}
