import type { BomWarning } from '../types'

export function BomWarnings({ warnings }: { warnings: BomWarning[] }) {
  // if (warnings.length === 0) {
  //   // return <div className="bom-validation bom-validation--clear"><strong>No structural warnings</strong><span>The workbook passed the parser's structural checks.</span></div>
  // }
  return (
    <details className="bom-validation">
      <summary><strong>{warnings.length.toLocaleString('en-US')} parsing warning{warnings.length === 1 ? '' : 's'}</strong><span>Review workbook assumptions</span></summary>
      <div className="bom-validation__list">
        {warnings.map((warning, index) => (
          <div className="bom-validation__item" key={`${warning.kind}-${warning.sourceRow}-${index}`}>
            <span>Excel row {warning.sourceRow}{warning.code ? ` · ${warning.code}` : ''}</span>
            <p>{warning.message}</p>
          </div>
        ))}
      </div>
    </details>
  )
}

