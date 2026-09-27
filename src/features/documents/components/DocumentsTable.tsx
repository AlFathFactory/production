import type { ProductionDocument } from '../types'
import { DocumentPdfActions } from './DocumentPdfActions'
import { DocumentTypeBadge } from './DocumentTypeBadge'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function formatCreatedAt(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function DocumentsTable({ documents }: { documents: ProductionDocument[] }) {
  return (
    <section className="documents-results" aria-label="Documents register results">
      <div className="documents-table-wrap" tabIndex={0} aria-label="Documents register table. Scroll horizontally to view all columns.">
        <table className="documents-table">
          <thead>
            <tr>
              <th scope="col">Document Type</th>
              <th scope="col">Reference</th>
              <th scope="col">Project</th>
              <th scope="col">Project Number</th>
              <th scope="col">Lot</th>
              <th scope="col">Document Date</th>
              <th scope="col">Created By</th>
              <th scope="col">PDF Status</th>
              <th scope="col">Created At</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.documentId}>
                <td><DocumentTypeBadge type={document.documentType} /></td>
                <td dir="auto"><strong>{document.documentReference}</strong></td>
                <td dir="auto">{document.projectName ?? '—'}</td>
                <td dir="auto">{document.projectNumber ?? '—'}</td>
                <td dir="auto">{document.lotNumber ?? '—'}</td>
                <td>{formatDate(document.documentDate)}</td>
                <td dir="auto">{document.createdByName ?? '—'}</td>
                <td><span className={`document-pdf-badge ${document.pdfPath ? 'document-pdf-badge--attached' : 'document-pdf-badge--missing'}`}>{document.pdfPath ? 'Attached' : 'Missing'}</span></td>
                <td>{formatCreatedAt(document.createdAt)}</td>
                <td>{document.pdfPath ? <DocumentPdfActions pdfPath={document.pdfPath} reference={document.documentReference} /> : <span className="document-no-pdf">No PDF</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
