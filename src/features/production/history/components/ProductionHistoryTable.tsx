import { canCorrectProduction } from '../../../auth/permissions'
import type { AppRole } from '../../../auth/types'
import type { ProductionStageEntry, ProductionStageEntryAudit } from '../types'

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatDateOnly(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    CUT: 'CUT',
    OUT_BEND: 'OUT BEND',
    BEND: 'BEND',
    ROLLING: 'ROLLING',
    DISPENSE: 'DISPENSE',
  }
  return labels[stage] ?? stage
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    manual: 'Manual',
    excel_import: 'Excel Import',
    document: 'Bending Document',
  }
  return labels[source] ?? source
}

function renderAuditChanges(audit: ProductionStageEntryAudit): React.ReactNode {
  if (!audit.oldData && !audit.newData) {
    return <span className="production-history-audit__no-data">No details available</span>
  }

  const allKeys = new Set([...Object.keys(audit.oldData ?? {}), ...Object.keys(audit.newData ?? {})])
  const changes: React.ReactNode[] = []

  for (const key of allKeys) {
    const oldVal = audit.oldData?.[key]
    const newVal = audit.newData?.[key]
    if (oldVal === newVal) continue

    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
    changes.push(
      <div key={key} className="production-history-audit__change">
        <span className="production-history-audit__label">{label}:</span>
        {oldVal !== undefined && newVal !== undefined ? (
          <>
            <span className="production-history-audit__old">{String(oldVal)}</span>
            <span className="production-history-audit__arrow">→</span>
            <span className="production-history-audit__new">{String(newVal)}</span>
          </>
        ) : oldVal !== undefined ? (
          <span className="production-history-audit__old">{String(oldVal)} → removed</span>
        ) : (
          <span className="production-history-audit__new">added → {String(newVal)}</span>
        )}
      </div>
    )
  }

  if (changes.length === 0) {
    return <span className="production-history-audit__no-data">No field changes</span>
  }

  return <div className="production-history-audit__changes">{changes}</div>
}

interface ProductionHistoryTableProps {
  history: ProductionStageEntry[]
  audit: ProductionStageEntryAudit[]
  userRole: AppRole | null
  onCorrect: (entry: ProductionStageEntry) => void
  onDelete: (entry: ProductionStageEntry) => void
}

export function ProductionHistoryTable({ history, audit, userRole, onCorrect, onDelete }: ProductionHistoryTableProps) {
  const isAdmin = canCorrectProduction(userRole ?? 'operator')

  return (
    <div className="production-history-dialog">
      <section className="production-history-dialog__section" aria-label="Stage history">
        <h3 className="production-history-dialog__section-title">Stage History</h3>
        {history.length === 0 ? (
          <p className="production-history-dialog__empty">No stage entries found for this item.</p>
        ) : (
          <div className="production-history-table-wrap">
            <table className="production-history-table">
              <thead>
                <tr>
                  <th scope="col">Stage</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Entry Date</th>
                  <th scope="col">Performed By</th>
                  <th scope="col">Source</th>
                  <th scope="col">Note</th>
                  <th scope="col">Created At</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td><span className="production-history-stage">{getStageLabel(entry.stage)}</span></td>
                    <td className="production-history-table__number">{entry.quantity}</td>
                    <td>{formatDateOnly(entry.entryDate)}</td>
                    <td>{entry.performedByName ?? '—'}</td>
                    <td><span className={`production-history-source production-history-source--${entry.source}`}>{getSourceLabel(entry.source)}</span></td>
                    <td>{entry.note ?? '—'}</td>
                    <td>{formatDate(entry.createdAt)}</td>
                    <td>
                      {isAdmin && entry.source !== 'document' ? (
                        <div className="production-history-actions">
                          <button type="button" className="button button--secondary" onClick={() => onCorrect(entry)}>Correct</button>
                          <button type="button" className="button button--secondary button--danger" onClick={() => onDelete(entry)}>Delete</button>
                        </div>
                      ) : entry.source === 'document' ? (
                        <span className="production-history-doc-badge">Document</span>
                      ) : (
                        <span className="production-history-view-only">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="production-history-dialog__section" aria-label="Audit history">
        <h3 className="production-history-dialog__section-title">Audit History</h3>
        {audit.length === 0 ? (
          <p className="production-history-dialog__empty">No audit records found.</p>
        ) : (
          <div className="production-history-table-wrap">
            <table className="production-history-table production-history-table--audit">
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Corrected By</th>
                  <th scope="col">Corrected At</th>
                  <th scope="col">Changes</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((record) => (
                  <tr key={record.id}>
                    <td><span className={`production-history-audit-action production-history-audit-action--${record.action}`}>{record.action === 'corrected' ? 'Corrected' : 'Deleted'}</span></td>
                    <td>{record.reason}</td>
                    <td>{record.correctedByName ?? '—'}</td>
                    <td>{formatDate(record.correctedAt)}</td>
                    <td>{renderAuditChanges(record)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}