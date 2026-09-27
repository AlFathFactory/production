import { progressStateLabels } from '../../production/constants'
import { currentStatusLabels } from '../constants'
import type { CurrentStatusContextLabels, CurrentStatusFilters } from '../types'

interface CurrentStatusContextProps {
  filters: CurrentStatusFilters
  labels: CurrentStatusContextLabels
}

export function CurrentStatusContext({ filters, labels }: CurrentStatusContextProps) {
  const statuses = filters.statuses.length === 0
    ? 'All Statuses'
    : filters.statuses.map((status) => currentStatusLabels[status]).join(', ')

  return (
    <section className="report-context" aria-labelledby="current-status-context-title">
      <h2 id="current-status-context-title">Report Context</h2>
      <dl>
        <div><dt>Project</dt><dd dir="auto">{labels.project || 'All Projects'}</dd></div>
        <div><dt>Project Number</dt><dd dir="auto">{labels.projectNumber || 'All Project Numbers'}</dd></div>
        <div><dt>Lot</dt><dd dir="auto">{labels.lot || 'All Lots'}</dd></div>
        <div><dt>Statuses</dt><dd dir="auto">{statuses}</dd></div>
        <div><dt>Routing</dt><dd dir="auto">{filters.routing ?? 'All Routes'}</dd></div>
        <div>
          <dt>Progress State</dt>
          <dd dir="auto">{filters.progressState ? progressStateLabels[filters.progressState] : 'All Progress States'}</dd>
        </div>
        {filters.query.trim() ? <div><dt>Search</dt><dd dir="auto">{filters.query.trim()}</dd></div> : null}
      </dl>
    </section>
  )
}
