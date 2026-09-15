import type { ProductionSearchRow } from '../types'

interface ProductionSummaryProps {
  items: ProductionSearchRow[]
}

export function ProductionSummary({ items }: ProductionSummaryProps) {
  const completed = items.filter((item) => item.progress_state === 'completed').length
  const inProgress = items.filter((item) => item.progress_state === 'in_progress').length
  const notStarted = items.filter((item) => item.progress_state === 'not_started').length
  const summary = [
    ['Total items', items.length],
    ['Completed', completed],
    ['In Progress', inProgress],
    ['Not Started', notStarted],
  ] as const

  return (
    <section className="production-summary" aria-label="Production result summary">
      {summary.map(([label, value]) => (
        <div className="production-summary__item" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  )
}
