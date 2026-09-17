import { useState } from 'react'

import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useDebouncedValue } from '../production/hooks/useDebouncedValue'
import { DocumentsFilters } from './components/DocumentsFilters'
import { DocumentsTable } from './components/DocumentsTable'
import { useDocuments } from './queries/documentQueries'
import type { DocumentType, PdfStatus } from './types'

export function DocumentsPage() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectNumberId, setProjectNumberId] = useState<string | null>(null)
  const [lotId, setLotId] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType | null>(null)
  const [pdfStatus, setPdfStatus] = useState<PdfStatus | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const filters = { documentType, lotId, pdfStatus, projectId, projectNumberId, search: debouncedSearch }
  const documentsQuery = useDocuments(filters)
  const hasActiveFilters = Boolean(projectId || projectNumberId || lotId || documentType || pdfStatus || search.trim())

  const selectProject = (value: string | null) => {
    setProjectId(value)
    setProjectNumberId(null)
    setLotId(null)
  }

  const selectProjectNumber = (value: string | null) => {
    setProjectNumberId(value)
    setLotId(null)
  }

  const resetFilters = () => {
    setProjectId(null)
    setProjectNumberId(null)
    setLotId(null)
    setDocumentType(null)
    setPdfStatus(null)
    setSearch('')
  }

  return (
    <>
      <PageHeader title="Documents" description="Browse Bending Dispatch and Bending Return documents across Production Control." />
      <div className="documents-workspace">
        <DocumentsFilters
          documentType={documentType}
          hasActiveFilters={hasActiveFilters}
          lotId={lotId}
          pdfStatus={pdfStatus}
          projectId={projectId}
          projectNumberId={projectNumberId}
          search={search}
          onDocumentTypeChange={setDocumentType}
          onLotChange={setLotId}
          onPdfStatusChange={setPdfStatus}
          onProjectChange={selectProject}
          onProjectNumberChange={selectProjectNumber}
          onReset={resetFilters}
          onSearchChange={setSearch}
        />
        {documentsQuery.isPending ? <section className="documents-state"><LoadingSpinner label="Loading Documents register" /> Loading Documents register…</section> : null}
        {documentsQuery.isError ? (
          <section className="documents-state documents-state--error" role="alert">
            <p>{documentsQuery.error.message}</p>
            <Button type="button" variant="secondary" onClick={() => void documentsQuery.refetch()}>Retry</Button>
          </section>
        ) : null}
        {documentsQuery.isSuccess && documentsQuery.data.length === 0 ? (
          <section className="documents-state">
            <p>{hasActiveFilters ? 'No documents match the current filters.' : 'No documents found.'}</p>
            {hasActiveFilters ? <Button type="button" variant="secondary" onClick={resetFilters}>Reset Filters</Button> : null}
          </section>
        ) : null}
        {documentsQuery.isSuccess && documentsQuery.data.length > 0 ? <DocumentsTable documents={documentsQuery.data} /> : null}
      </div>
    </>
  )
}
