import type { ProductionRoute } from '../types'

export function ProductionRouteBadge({ route }: { route: ProductionRoute | null }) {
  return <span className="production-route-badge">{route ?? '—'}</span>
}
