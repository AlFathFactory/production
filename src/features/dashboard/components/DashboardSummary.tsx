import type { DashboardSummary, LotDashboardItem } from '../types'

interface DashboardSummaryProps {
  summary: DashboardSummary
}

export function DashboardSummary({ summary }: DashboardSummaryProps) {
  const items = [
    ['Total Lots', summary.totalLots],
    ['Total Production Items', summary.totalItems],
    ['Items In Progress', summary.inProgressItems],
    ['Items Completed', summary.completedItems],
  ] as const

  return (
    <section className="dashboard-summary" aria-label="Dashboard summary">
      {items.map(([label, value]) => (
        <div className="dashboard-summary__item" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  )
}

export function computeDashboardSummary(lotDashboardItems: LotDashboardItem[]): DashboardSummary {
  return {
    totalLots: lotDashboardItems.length,
    totalItems: lotDashboardItems.reduce((sum, lot) => sum + lot.totalItems, 0),
    inProgressItems: lotDashboardItems.reduce((sum, lot) => sum + lot.inProgressItems, 0),
    completedItems: lotDashboardItems.reduce((sum, lot) => sum + lot.completedItems, 0),
  }
}