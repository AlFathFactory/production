import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { ProjectLotSelector } from '../../production/components/ProjectLotSelector'
import type { DocumentType, PdfStatus } from '../types'

interface DocumentsFiltersProps {
  documentType: DocumentType | null
  hasActiveFilters: boolean
  lotId: string | null
  pdfStatus: PdfStatus | null
  projectId: string | null
  projectNumberId: string | null
  search: string
  onDocumentTypeChange: (value: DocumentType | null) => void
  onLotChange: (value: string | null) => void
  onPdfStatusChange: (value: PdfStatus | null) => void
  onProjectChange: (value: string | null) => void
  onProjectNumberChange: (value: string | null) => void
  onReset: () => void
  onSearchChange: (value: string) => void
}

export function DocumentsFilters({
  documentType,
  hasActiveFilters,
  lotId,
  pdfStatus,
  projectId,
  projectNumberId,
  search,
  onDocumentTypeChange,
  onLotChange,
  onPdfStatusChange,
  onProjectChange,
  onProjectNumberChange,
  onReset,
  onSearchChange,
}: DocumentsFiltersProps) {
  return (
    <div className="documents-filter-stack">
      <ProjectLotSelector
        ariaLabel="Documents hierarchy filters"
        idPrefix="documents"
        lotId={lotId}
        projectId={projectId}
        projectNumberId={projectNumberId}
        onLotChange={(value) => onLotChange(value)}
        onProjectChange={(value) => onProjectChange(value)}
        onProjectNumberChange={(value) => onProjectNumberChange(value)}
      />
      <section className="documents-filters" aria-label="Document filters">
        <FormField label="Document Type" htmlFor="document-type-filter">
          <Select id="document-type-filter" value={documentType ?? ''} onChange={(event) => onDocumentTypeChange((event.target.value || null) as DocumentType | null)}>
            <option value="">All document types</option>
            <option value="bending_dispatch">Bending Dispatch</option>
            <option value="bending_return">Bending Return</option>
          </Select>
        </FormField>
        <FormField label="PDF Status" htmlFor="document-pdf-status-filter">
          <Select id="document-pdf-status-filter" value={pdfStatus ?? ''} onChange={(event) => onPdfStatusChange((event.target.value || null) as PdfStatus | null)}>
            <option value="">All PDF statuses</option>
            <option value="attached">Attached</option>
            <option value="missing">Missing</option>
          </Select>
        </FormField>
        <FormField label="Text Search" htmlFor="document-search-filter">
          <Input id="document-search-filter" placeholder="Dispatch number or return reference" type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} />
        </FormField>
        {hasActiveFilters ? <Button className="documents-filters__reset" type="button" variant="secondary" onClick={onReset}>Reset Filters</Button> : null}
      </section>
    </div>
  )
}
