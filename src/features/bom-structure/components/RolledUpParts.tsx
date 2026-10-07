import type { RolledUpBomPart } from '../types'

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 })

export function RolledUpParts({ parts }: { parts: RolledUpBomPart[] }) {
  return (
    <section className="bom-rollup" aria-label="Rolled-up leaf parts">
      <div className="bom-rollup__intro">
        <div><h2>Leaf Parts</h2><p>Leaf occurrences grouped by component code. No data is imported or saved.</p></div>
        <strong>{parts.length.toLocaleString('en-US')} unique leaves</strong>
      </div>
      <div className="bom-rollup__table-wrap">
        <table className="bom-rollup__table">
          <thead><tr><th>Code</th><th>Description</th><th>Material</th><th>Total Quantity</th><th>Unit Weight</th><th>Total Weight</th></tr></thead>
          <tbody>
            {parts.map((part, index) => (
              <tr key={`${part.code}-${index}`}>
                <td><strong>{part.code || '—'}</strong></td><td>{part.description || '—'}</td><td>{part.material || '—'}</td>
                <td className="bom-number">{number.format(part.totalQuantity)}</td>
                <td className="bom-number">{part.unitWeightKg === null ? '—' : `${number.format(part.unitWeightKg)} kg`}</td>
                <td className="bom-number">{number.format(part.totalWeightKg)} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

