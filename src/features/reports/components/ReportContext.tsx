import type { ReportContextData } from '../types'

interface ReportContextProps {
  context: ReportContextData
}

export function ReportContext({ context }: ReportContextProps) {
  return (
    <section className="report-context" aria-labelledby="report-context-title">
      <h2 id="report-context-title">Report Context</h2>
      <dl>
        <div><dt>Period</dt><dd dir="auto">{context.period}</dd></div>
        <div><dt>Project</dt><dd dir="auto">{context.project}</dd></div>
        <div><dt>Project Number</dt><dd dir="auto">{context.projectNumber}</dd></div>
        <div><dt>Lot</dt><dd dir="auto">{context.lot}</dd></div>
        <div><dt>Operations</dt><dd dir="auto">{context.operations}</dd></div>
        {context.routing ? <div><dt>Routing</dt><dd dir="auto">{context.routing}</dd></div> : null}
        {context.performedBy ? <div><dt>Performed By</dt><dd dir="auto">{context.performedBy}</dd></div> : null}
        {context.searchText ? <div><dt>Search</dt><dd dir="auto">{context.searchText}</dd></div> : null}
      </dl>
    </section>
  )
}
