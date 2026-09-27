import './Reports.css'

import { useState } from 'react'

import { PageHeader } from '../../components/shared/PageHeader'
import { CurrentStatusReport } from './components/CurrentStatusReport'
import { HistoricalEventsReport } from './components/HistoricalEventsReport'
import type { ReportsMode } from './types'

export function ReportsPage() {
  const [mode, setMode] = useState<ReportsMode>('historical-events')

  return (
    <>
      <PageHeader
        title="Reports"
        description={mode === 'historical-events'
          ? 'Review saved Production operations using the authoritative report data.'
          : 'Review the current production position and pending operational quantities.'}
      />
      <div className="reports-workspace">
        <div className="reports-mode-switch" role="tablist" aria-label="Report mode">
          <button
            id="reports-mode-historical"
            type="button"
            role="tab"
            aria-controls="reports-panel-historical"
            aria-selected={mode === 'historical-events'}
            onClick={() => setMode('historical-events')}
          >
            Historical Events
          </button>
          <button
            id="reports-mode-current"
            type="button"
            role="tab"
            aria-controls="reports-panel-current"
            aria-selected={mode === 'current-status'}
            onClick={() => setMode('current-status')}
          >
            Current Status
          </button>
        </div>
        <div
          id="reports-panel-historical"
          className="reports-mode-panel"
          role="tabpanel"
          aria-labelledby="reports-mode-historical"
          hidden={mode !== 'historical-events'}
        >
          <HistoricalEventsReport active={mode === 'historical-events'} />
        </div>
        <div
          id="reports-panel-current"
          className="reports-mode-panel"
          role="tabpanel"
          aria-labelledby="reports-mode-current"
          hidden={mode !== 'current-status'}
        >
          <CurrentStatusReport active={mode === 'current-status'} />
        </div>
      </div>
    </>
  )
}
