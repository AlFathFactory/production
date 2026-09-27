import type { ReportContextData } from '../types'

interface ReportContextProps {
  context: ReportContextData
}

export function ReportContext({ context }: ReportContextProps) {
  return (
    <section className="report-context" aria-labelledby="report-context-title">
      <h2 id="report-context-title">Report Context</h2>
      <dl>
        <div><dt>Period</dt><dd>{context.period}</dd></div>
        <div><dt>Project</dt><dd>{context.project}</dd></div>
        <div><dt>Project Number</dt><dd>{context.projectNumber}</dd></div>
        <div><dt>Lot</dt><dd>{context.lot}</dd></div>
        <div><dt>Operations</dt><dd>{context.operations}</dd></div>
        {context.routing ? <div><dt>Routing</dt><dd>{context.routing}</dd></div> : null}
        {context.performedBy ? <div><dt>Performed By</dt><dd>{context.performedBy}</dd></div> : null}
        {context.searchText ? <div><dt>Search</dt><dd>{context.searchText}</dd></div> : null}
      </dl>
    </section>
  )
}
