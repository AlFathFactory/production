import type { BomSummary as BomSummaryModel } from '../types'

const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const weight = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

export function BomSummary({ summary }: { summary: BomSummaryModel }) {
  const metrics = [
    ['Root Code', summary.rootCode || '—'],
    ['Rows', integer.format(summary.rows)],
    ['Levels', integer.format(summary.levels)],
    ['Unique Codes', integer.format(summary.uniqueCodes)],
    ['Assemblies', integer.format(summary.assemblies)],
    ['Parts', integer.format(summary.parts)],
    ['Materials', integer.format(summary.materials)],
    ['Leaf Items', integer.format(summary.leafItems)],
    ['Leaf Mass', `${weight.format(summary.totalCalculatedLeafMassKg)} kg`],
  ]
  return (
    <section className="bom-summary" aria-label="BOM summary">
      {metrics.map(([label, value]) => (
        <div className="bom-summary__metric" key={label}><span>{label}</span><strong>{value}</strong></div>
      ))}
    </section>
  )
}

