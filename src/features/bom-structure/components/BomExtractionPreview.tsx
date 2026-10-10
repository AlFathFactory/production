import { useState } from 'react'

import type { BomExtractionCandidate } from '../types/bomDomain.types'

type Route = 'BEND' | 'NO BEND' | 'ROD' | 'ROLLING' | 'LADDER' | 'OTHER'
const ROUTES: Route[] = ['BEND', 'NO BEND', 'ROD', 'ROLLING', 'LADDER', 'OTHER']

function formatNumber(value: number | null): string { return value === null ? '—' : value.toLocaleString('en-US') }
function formatBlockers(value: BomExtractionCandidate['blockers']): string {
  if (value === null) return 'None'
  if (Array.isArray(value)) return value.length ? value.map((entry) => typeof entry === 'string' ? entry : JSON.stringify(entry)).join('; ') : 'None'
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export function BomExtractionPreview({ candidates, importId }: { candidates: BomExtractionCandidate[]; importId: string }) {
  const [assignments, setAssignments] = useState<Record<string, Route>>({})
  return <section className="bom-extraction-preview" aria-label="Production extraction preview">
    <h2>Production extraction preview</h2>
    <p>Read-only backend preview. Route assignments below are local to this screen and are not saved or sent to Production.</p>
    <div className="bom-extraction-preview__scroll"><table>
      <thead><tr><th>Article</th><th>Designation</th><th>Dimensions</th><th>Material</th><th>Quantity</th><th>Weight (kg)</th><th>Blockers</th><th>Route assignment</th></tr></thead>
      <tbody>{candidates.map((candidate, index) => {
        const key = candidate.representativeNodeId ?? `${candidate.article ?? 'candidate'}-${index}`
        return <tr key={key}>
          <td>{candidate.article ?? '—'}</td><td>{candidate.designation ?? '—'}</td>
          <td>Profile: {candidate.profile ?? '—'} · L: {formatNumber(candidate.lengthValue)} · W: {formatNumber(candidate.widthValue)} · H: {formatNumber(candidate.heightValue)}</td>
          <td>{candidate.material ?? '—'}</td><td>{formatNumber(candidate.totalQuantity)}</td><td>{formatNumber(candidate.totalWeightKg)}</td>
          <td>{formatBlockers(candidate.blockers)}</td>
          <td><select aria-label={`Route for ${candidate.article ?? `candidate ${index + 1}`}`} value={assignments[key] ?? ''}
            onChange={(event) => setAssignments((current) => ({ ...current, [key]: event.target.value as Route }))}>
            <option value="">Unassigned</option>{ROUTES.map((route) => <option key={route} value={route}>{route}</option>)}
          </select></td>
        </tr>
      })}</tbody>
    </table></div>
    {candidates.length === 0 ? <p>No extraction candidates were returned.</p> : null}
    <p>{Object.keys(assignments).filter((key) => assignments[key]).length} of {candidates.length} routes selected for import {importId}. Assignments are discarded when this view closes.</p>
  </section>
}
