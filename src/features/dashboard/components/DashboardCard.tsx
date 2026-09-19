import type { ReactNode } from 'react'

import './DashboardCard.css'

interface DashboardCardProps {
  title: string
  children: ReactNode
}

export function DashboardCard({ title, children }: DashboardCardProps) {
  return (
    <section className="opc-card" aria-label={title}>
      <h3 className="opc-card__title">{title}</h3>
      <div className="opc-card__body">{children}</div>
    </section>
  )
}
