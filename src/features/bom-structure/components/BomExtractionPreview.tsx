import { useMemo, useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { useBomExtraction } from '../hooks/useBomExtraction'
import { useBomExtractionStatus } from '../queries/usePersistedBom'
import type { BomExtractionCandidate } from '../types/bomDomain.types'
import { useRouteAssignmentOptions } from '../../settings/queries/routeAssignmentOptionsQueries'
import type { ProductionRoute } from '../../production/types'
import { designationCode, designationSelectionStatus, type DesignationSelectionStatus } from '../designationTypes'
import { useBomDesignationMappings } from '../queries/useBomDesignationMappings'

const PAGE_SIZE = 25
const DESIGNATION_STATUS_LABELS: Record<DesignationSelectionStatus, string> = {
  unselected: 'Not selected',
  pending: 'Pending',
  saved: 'Saved',
}

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
  canManageDesignationMappings?: boolean
  canUpdateDesignationMappings?: boolean
}

interface PendingMappingUpdate {
  code: string
  mappingId: string
  typeId: string
}

export function BomExtractionPreview({
  candidates, importId, versionNumber, canExecute,
  canManageDesignationMappings = canExecute,
  canUpdateDesignationMappings = false,
}: BomExtractionPreviewProps) {
  const [assignments, setAssignments] = useState<Record<string, ProductionRoute>>({})
  const [designationSelections, setDesignationSelections] = useState<Record<string, string>>({})
  const [savedMappings, setSavedMappings] = useState<Record<string, { id: string; typeId: string }>>({})
  const [pendingMappingUpdate, setPendingMappingUpdate] = useState<PendingMappingUpdate | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [search, setSearch] = useState('')
  const [designationStatusFilter, setDesignationStatusFilter] = useState<'all' | DesignationSelectionStatus>('all')
  const [page, setPage] = useState(1)
  const statusQuery = useBomExtractionStatus(importId, true)
  const routeOptionsQuery = useRouteAssignmentOptions()
  const designationMappings = useBomDesignationMappings()
  const extraction = useBomExtraction(importId)
  const status = statusQuery.data ?? null
  const alreadyExtracted = status !== null
  const activeRouteOptions = useMemo(() => (routeOptionsQuery.data ?? []).filter((option) => option.isActive), [routeOptionsQuery.data])
  const activeRoutes = useMemo(() => new Set(activeRouteOptions.map((option) => option.route)), [activeRouteOptions])
  const designationTypes = designationMappings.typesQuery.data ?? []
  const designationTypeById = useMemo(() => new Map(designationTypes.map((type) => [type.id, type])), [designationTypes])
  const mappedDesignationByCode = useMemo(() => {
    const rows = new Map<string, { id: string; typeId: string }>()
    for (const mapping of designationMappings.mappingsQuery.data ?? []) {
      if (!designationTypeById.has(mapping.typeId)) continue
      const code = designationCode(mapping.code)
      if (code && !rows.has(code)) rows.set(code, { id: mapping.id, typeId: mapping.typeId })
    }
    for (const [code, mapping] of Object.entries(savedMappings)) rows.set(code, mapping)
    return rows
  }, [designationMappings.mappingsQuery.data, designationTypeById, savedMappings])
  const designationReady = designationMappings.typesQuery.isSuccess && designationMappings.mappingsQuery.isSuccess
  const designationLoadError = designationMappings.typesQuery.error || designationMappings.mappingsQuery.error
  const designationSaveError = designationMappings.createMutation.error || designationMappings.updateMutation.error

  const designationStatusForCode = (code: string | null): DesignationSelectionStatus => {
    const persistedTypeId = code ? mappedDesignationByCode.get(code)?.typeId : undefined
    const selectedTypeId = code ? designationSelections[code] ?? persistedTypeId : undefined
    return designationSelectionStatus(persistedTypeId, selectedTypeId)
  }

  const assignable = useMemo(
    () => candidates.map((candidate, index) => ({ candidate, index, key: assignmentKey(candidate) })),
    [candidates],
  )
  const searchedCandidates = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return assignable
    return assignable.filter(({ candidate }) => [candidate.article, candidate.designation, candidate.profile, candidate.material]
      .some((value) => value?.toLocaleLowerCase().includes(query)))
  }, [assignable, search])
  const designationStatusCounts = useMemo(() => {
    const counts: Record<DesignationSelectionStatus, number> = { unselected: 0, pending: 0, saved: 0 }
    for (const { candidate } of assignable) counts[designationStatusForCode(designationCode(candidate.designation))] += 1
    return counts
  }, [assignable, designationSelections, mappedDesignationByCode])
  const filteredCandidates = useMemo(() => designationStatusFilter === 'all'
    ? searchedCandidates
    : searchedCandidates.filter(({ candidate }) => designationStatusForCode(designationCode(candidate.designation)) === designationStatusFilter),
  [searchedCandidates, designationStatusFilter, designationSelections, mappedDesignationByCode])
  const pageCount = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const visibleCandidates = filteredCandidates.slice(firstIndex, firstIndex + PAGE_SIZE)
  const blockedCount = useMemo(
    () => candidates.filter((candidate) => hasNonRoutingBlocker(candidate.blockers)).length,
    [candidates],
  )
  const assignedCount = assignable.filter(({ key }) => key && assignments[key] && activeRoutes.has(assignments[key])).length
  const assignableCount = assignable.filter(({ key }) => key !== null).length
  const allAssigned = assignableCount > 0 && assignedCount === assignableCount
  const routeSettingsReady = routeOptionsQuery.isSuccess && activeRouteOptions.length > 0
  const canSubmit = canExecute && routeSettingsReady && !alreadyExtracted && !statusQuery.isPending
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

  const selectDesignationType = (code: string | null, typeId: string) => {
    if (!code) return
    const existing = mappedDesignationByCode.get(code)
    if (existing && existing.typeId !== typeId && !canUpdateDesignationMappings) return
    setDesignationSelections((current) => ({ ...current, [code]: typeId }))
    setPendingMappingUpdate(existing && existing.typeId !== typeId
      ? { code, mappingId: existing.id, typeId }
      : null)
  }

  const saveNewDesignationMapping = (code: string) => {
    const typeId = designationSelections[code]
    if (!typeId) return
    designationMappings.createMutation.mutate({ code, typeId }, {
      onSuccess: (mapping) => setSavedMappings((current) => ({ ...current, [code]: { id: mapping.id, typeId: mapping.typeId } })),
      onError: () => { void designationMappings.refresh() },
    })
  }

  const updateDesignationMapping = () => {
    if (!pendingMappingUpdate) return
    const pending = pendingMappingUpdate
    designationMappings.updateMutation.mutate({ mappingId: pending.mappingId, typeId: pending.typeId }, {
      onSuccess: (mapping) => {
        setSavedMappings((current) => ({ ...current, [pending.code]: { id: mapping.id, typeId: mapping.typeId } }))
        setPendingMappingUpdate(null)
      },
      onError: () => { void designationMappings.refresh() },
    })
  }

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
    {routeOptionsQuery.isPending ? <p role="status">Loading route assignment options…</p> : null}
    {routeOptionsQuery.error ? <p role="alert">Could not load route assignment options. Extraction is unavailable until this is resolved. <button type="button" onClick={() => void routeOptionsQuery.refetch()}>Retry</button></p> : null}
    {routeOptionsQuery.isSuccess && activeRouteOptions.length === 0 ? <p role="alert">No active Route Assignment options are configured. Contact an administrator.</p> : null}
    {designationMappings.typesQuery.isPending || designationMappings.mappingsQuery.isPending ? <p role="status">Loading designation types…</p> : null}
    {designationLoadError ? <p role="alert">Could not load designation types. No fallback values are available. <button type="button" onClick={() => void designationMappings.refresh()}>Retry</button></p> : null}
    {designationSaveError ? <p role="alert">Could not save the designation mapping. The preview selection was kept; reload mappings before retrying.</p> : null}

    <label className="bom-extraction-preview__search">
      <span>Search candidates</span>
      <Input type="search" placeholder="Article, designation, profile, or material" value={search}
        onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
    </label>
    <label className="bom-extraction-preview__status-filter">
      <span>Designation Type Status</span>
      <Select aria-label="Filter designation type status" value={designationStatusFilter} onChange={(event) => { setDesignationStatusFilter(event.target.value as 'all' | DesignationSelectionStatus); setPage(1) }}>
        <option value="all">All ({candidates.length})</option>
        <option value="unselected">Not Selected ({designationStatusCounts.unselected})</option>
        <option value="pending">Pending ({designationStatusCounts.pending})</option>
        <option value="saved">Saved ({designationStatusCounts.saved})</option>
      </Select>
    </label>

    <div className="bom-extraction-preview__scroll"><table className="bom-extraction-preview__table">
      <thead><tr><th>Article</th><th>Designation</th><th>Designation Type</th><th>Dimensions</th><th>Material</th><th>Quantity</th><th>Unit weight (kg)</th><th>Total weight (kg)</th><th>Route assignment</th></tr></thead>
      <tbody>{visibleCandidates.map(({ candidate, key, index }) => {
        const rowKey = candidate.representativeNodeId ?? `${candidate.article ?? 'candidate'}-${index}`
        const blocked = hasNonRoutingBlocker(candidate.blockers)
        const selectedRoute = key ? assignments[key] : undefined
        const isUnavailable = Boolean(selectedRoute && !activeRoutes.has(selectedRoute))
        const code = designationCode(candidate.designation)
        const existingDesignationMapping = code ? mappedDesignationByCode.get(code) : undefined
        const selectedDesignationType = code ? designationSelections[code] ?? existingDesignationMapping?.typeId ?? '' : ''
        const designationStatus = designationStatusForCode(code)
        const canSelectDesignation = designationReady && Boolean(code) && canManageDesignationMappings
          && (!existingDesignationMapping || canUpdateDesignationMappings)
        const needsNewMappingSave = Boolean(code && selectedDesignationType && !existingDesignationMapping)
        const needsUpdateConfirmation = pendingMappingUpdate?.code === code && Boolean(existingDesignationMapping)
        return <tr key={rowKey}>
          <td><strong>{candidate.article ?? '—'}</strong></td><td>{candidate.designation ?? '—'}</td>
          <td><div className="bom-designation-type" data-status={designationStatus}>{designationLoadError ? <span role="alert">Unavailable</span>
            : !code ? <span>Not available</span>
              : <><Select className="bom-designation-type__select" aria-label={`Designation type for ${code}`} disabled={!canSelectDesignation}
                  value={selectedDesignationType} onChange={(event) => selectDesignationType(code, event.target.value)}>
                  <option value="">Select type</option>
                  {designationTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </Select>
                {needsNewMappingSave ? <Button type="button" variant="secondary" isLoading={designationMappings.createMutation.isPending}
                  onClick={() => saveNewDesignationMapping(code)}>Save Mapping</Button> : null}
                {needsUpdateConfirmation ? <span className="bom-designation-type__confirmation">
                  Update mapping for {code} from {designationTypeById.get(existingDesignationMapping!.typeId)?.name ?? 'current type'} to {designationTypeById.get(selectedDesignationType)?.name ?? 'selected type'}?
                  <Button type="button" variant="secondary" isLoading={designationMappings.updateMutation.isPending} onClick={updateDesignationMapping}>Update Mapping</Button>
                  <Button type="button" variant="secondary" onClick={() => {
                    setDesignationSelections((current) => { const next = { ...current }; delete next[code]; return next })
                    setPendingMappingUpdate(null)
                  }}>Cancel</Button>
                </span> : null}
              </>}</div><span className="bom-designation-type__status" data-status={designationStatus}>{DESIGNATION_STATUS_LABELS[designationStatus]}</span></td>
          <td>Profile: {candidate.profile ?? '—'} · L: {formatNumber(candidate.lengthValue)} · W: {formatNumber(candidate.widthValue)} · H: {formatNumber(candidate.heightValue)}</td>
          <td>{candidate.material ?? '—'}</td>
          <td className="bom-number">{formatNumber(candidate.totalQuantity)}</td>
          <td className="bom-number">{formatNumber(candidate.unitWeightKg)}</td>
          <td className="bom-number">{formatNumber(candidate.totalWeightKg)}</td>
          <td>{key === null || blocked
            ? <span>Not assignable</span>
            : <div className="bom-route-select" data-state={isUnavailable ? 'unavailable' : selectedRoute ? 'selected' : 'empty'}>
              <span aria-hidden="true" className="bom-route-select__indicator" />
              <select aria-label={`Route for ${key}`} disabled={!canExecute || alreadyExtracted || !routeSettingsReady} value={selectedRoute ?? ''}
                onChange={(event) => setAssignments((current) => ({ ...current, [key]: event.target.value as ProductionRoute }))}>
                <option value="">Choose route…</option>
                {isUnavailable ? <option value={selectedRoute} disabled>Unavailable: {selectedRoute}</option> : null}
                {activeRouteOptions.map((option) => <option key={option.id} value={option.route}>{option.label}</option>)}
              </select>
            </div>}</td>
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
