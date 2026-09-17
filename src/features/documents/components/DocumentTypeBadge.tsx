import type { DocumentType } from '../types'

const labels: Record<DocumentType, string> = {
  bending_dispatch: 'Bending Dispatch',
  bending_return: 'Bending Return',
}

export function DocumentTypeBadge({ type }: { type: DocumentType }) {
  return <span className={`document-type-badge document-type-badge--${type}`}>{labels[type]}</span>
}
