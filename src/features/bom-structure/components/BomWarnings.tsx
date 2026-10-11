import { useState } from 'react'

import { AppNotification } from '../../../components/ui/AppNotification'
import type { BomWarning } from '../types'

function SavedWarningsClearNotification() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <AppNotification autoDismissMs={5000} onDismiss={() => setVisible(false)} title="No saved warnings">
      <span>The saved import has no backend warnings.</span>
    </AppNotification>
  )
}

export function BomWarnings({ warnings, persisted = false }: { warnings: BomWarning[]; persisted?: boolean }) {
  if (warnings.length === 0) {
    if (persisted) return <SavedWarningsClearNotification />
    return <div className="bom-validation bom-validation--clear"><strong>No parsing warnings</strong><span>The workbook passed the parser’s structural checks.</span></div>
  }
  return (
    <details className="bom-validation">
      <summary><strong>{warnings.length.toLocaleString('en-US')} {persisted ? 'saved' : 'parsing'} warning{warnings.length === 1 ? '' : 's'}</strong><span>Review workbook assumptions</span></summary>
      <div className="bom-validation__list">
        {warnings.map((warning, index) => (
          <div className="bom-validation__item" key={`${warning.kind}-${warning.sourceRow}-${index}`}>
            <span>{warning.sourceRow > 0 ? `Excel row ${warning.sourceRow}` : 'Import'}{warning.code ? ` · ${warning.code}` : ''}</span>
            <p>{warning.message}</p>
          </div>
        ))}
      </div>
    </details>
  )
}
