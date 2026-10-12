import { useMemo, useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { useBomExtraction } from '../hooks/useBomExtraction'
import { useBomExtractionStatus } from '../queries/usePersistedBom'
import type { BomExtractionCandidate } from '../types/bomDomain.types'

type Route = 'BEND' | 'NO BEND' | 'ROD' | 'ROLLING' | 'LADDER' | 'OTHER'
const ROUTES: Route[] = ['BEND', 'NO BEND', 'ROD', 'ROLLING', 'LADDER', 'OTHER']
const PAGE_SIZE = 25

function formatNumber(value: number | null): string { return value === null ? '—' : value.toLocaleString('en-US') }

function hasNonRoutingBlocker(value: BomExtractionCandidate['blockers']): boolean {
  if (!Array.isArray(value)) return true
  return value.some((entry) => entry !== 'routing-assignment-required')
}

function assignmentKey(candidate: BomExtractionCandidate): string | null {
  if (candidate.article && candidate.article.trim()) return candidate.article
  return null
}

interface BomExtractionPreviewProps {
  candidates: BomExtractionCandidate[]
  importId: string
  lotId: string | null
  versionNumber: number
  canExecute: boolean
}

export function BomExtractionPreview({ candidates, importId, versionNumber, canExecute }: BomExtractionPreviewProps) {
  const [assignments, setAssignments] = useState<Record<string, Route>>({})
  const [confirmed, setConfirmed] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const statusQuery = useBomExtractionStatus(importId, true)
  const extraction = useBomExtraction(importId)
  const status = statusQuery.data ?? null
  const alreadyExtracted = status !== null

  const assignable = useMemo(
    () => candidates.map((candidate, index) => ({ candidate, index, key: assignmentKey(candidate) })),
    [candidates],
  )
  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return assignable
    return assignable.filter(({ candidate }) => [candidate.article, candidate.designation, candidate.profile, candidate.material]
      .some((value) => value?.toLocaleLowerCase().includes(query)))
  }, [assignable, search])
  const pageCount = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const visibleCandidates = filteredCandidates.slice(firstIndex, firstIndex + PAGE_SIZE)
  const blockedCount = useMemo(
    () => candidates.filter((candidate) => hasNonRoutingBlocker(candidate.blockers)).length,
    [candidates],
  )
  const assignedCount = assignable.filter(({ key }) => key && assignments[key]).length
  const assignableCount = assignable.filter(({ key }) => key !== null).length
  const allAssigned = assignableCount > 0 && assignedCount === assignableCount
  const canSubmit = canExecute && !alreadyExtracted && !statusQuery.isPending
    && candidates.length > 0 && blockedCount === 0 && allAssigned && confirmed
    && !extraction.executeMutation.isPending

  const submit = () => {
    if (!canSubmit) return
    const payload: Record<string, string> = {}
    for (const { key } of assignable) {
      if (key && assignments[key]) payload[key] = assignments[key]
    }
    extraction.executeMutation.mutate(payload)
  }

  const result = extraction.executeMutation.data ?? null
  const error = extraction.executeMutation.error instanceof Error ? extraction.executeMutation.error.message : null

  return <section className="bom-extraction-preview" aria-label="Production extraction preview">
    <h2>Production extraction preview</h2>
    {statusQuery.isPending ? <p role="status">Checking whether this version was already extracted…</p> : null}
    {statusQuery.error ? <p role="alert">
      Could not load the extraction ledger. <button type="button" onClick={() => void statusQuery.refetch()}>Retry</button>
    </p> : null}
    {status ? <p role="status">
      Already extracted on {status.createdAt.toLocaleString()} — {status.createdCount} of {status.candidateCount} items created
      (extraction {status.extractionId}). Re-extraction of this version is not allowed.
    </p> : null}
    {!canExecute ? <p role="note">Extraction requires an active Supervisor or Admin account. Operators can inspect this preview.</p> : null}

    <label className="bom-extraction-preview__search">
      <span>Search candidates</span>
      <Input type="search" placeholder="Article, designation, profile, or material" value={search}
        onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
    </label>

    <div className="bom-extraction-preview__scroll"><table className="bom-extraction-preview__table">
      <thead><tr><th>Article</th><th>Designation</th><th>Dimensions</th><th>Material</th><th>Quantity</th><th>Unit weight (kg)</th><th>Total weight (kg)</th><th>Route assignment</th></tr></thead>
      <tbody>{visibleCandidates.map(({ candidate, key, index }) => {
        const rowKey = candidate.representativeNodeId ?? `${candidate.article ?? 'candidate'}-${index}`
        const blocked = hasNonRoutingBlocker(candidate.blockers)
        return <tr key={rowKey}>
          <td><strong>{candidate.article ?? '—'}</strong></td><td>{candidate.designation ?? '—'}</td>
          <td>Profile: {candidate.profile ?? '—'} · L: {formatNumber(candidate.lengthValue)} · W: {formatNumber(candidate.widthValue)} · H: {formatNumber(candidate.heightValue)}</td>
          <td>{candidate.material ?? '—'}</td>
          <td className="bom-number">{formatNumber(candidate.totalQuantity)}</td>
          <td className="bom-number">{formatNumber(candidate.unitWeightKg)}</td>
          <td className="bom-number">{formatNumber(candidate.totalWeightKg)}</td>
          <td>{key === null || blocked
            ? <span>Not assignable</span>
            : <select aria-label={`Route for ${key}`} disabled={!canExecute || alreadyExtracted} value={key && assignments[key] ? assignments[key] : ''}
              onChange={(event) => setAssignments((current) => ({ ...current, [key]: event.target.value as Route }))}>
              <option value="">Unassigned</option>{ROUTES.map((route) => <option key={route} value={route}>{route}</option>)}
            </select>}</td>
        </tr>
      })}</tbody>
    </table></div>
    {candidates.length === 0 ? <p>No extraction candidates were returned.</p> : null}
    {candidates.length > 0 && filteredCandidates.length === 0 ? <p>No extraction candidates match your search.</p> : null}
    <nav className="bom-extraction-preview__pagination" aria-label="Extraction preview pages">
      <span>Showing {filteredCandidates.length ? firstIndex + 1 : 0}–{Math.min(firstIndex + PAGE_SIZE, filteredCandidates.length)} of {filteredCandidates.length} candidates</span>
      <div className="bom-extraction-preview__pagination-controls">
        <Button type="button" variant="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
        <span aria-live="polite">Page {currentPage} of {pageCount}</span>
        <Button type="button" variant="secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button>
      </div>
    </nav>
    <p>{assignedCount} of {assignableCount} routes assigned for import {importId}.</p>
    {blockedCount > 0 ? <p role="alert">{blockedCount} candidate(s) have unresolved non-routing blockers. Resolve them in the BOM before extracting.</p> : null}

    {canExecute && !alreadyExtracted && candidates.length > 0 ? <>
      <label>
        <input checked={confirmed} type="checkbox" onChange={(event) => setConfirmed(event.target.checked)} />
        I confirm extraction of v{versionNumber} ({candidates.length} items) as new Production items.
      </label>
      <button disabled={!canSubmit} type="button" onClick={submit}>
        {extraction.executeMutation.isPending ? 'Extracting…' : 'Extract to Production'}
      </button>
    </> : null}

    {result ? <p role="status">
      {result.alreadyExtracted ? 'This request was already completed. No new items were written. ' : ''}
      Extraction {result.extractionId}: {result.createdCount} created, {result.skippedCount} skipped.
    </p> : null}
    {error ? <p role="alert">
      {error} The retry reuses request {extraction.requestId}; reload the extraction status first if the outcome is unclear.
      {' '}<button type="button" onClick={() => void statusQuery.refetch()}>Reload extraction status</button>
    </p> : null}
  </section>
}
