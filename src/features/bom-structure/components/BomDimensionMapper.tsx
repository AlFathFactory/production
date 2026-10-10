import { useMemo, useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import {
  DIMENSION_ROLE_LABELS,
  DIMENSION_ROLES,
  extractDimensionTokens,
  suggestDimensionRoles,
  type DimensionRole,
} from '../descriptionDimensions'
import { useBomDimensionMapping } from '../queries/useBomDimensionMapping'

interface BomDimensionMapperProps {
  canManage: boolean
  code: string
  description: string
}

function rolesEqual(left: DimensionRole[] | null, right: DimensionRole[]): boolean {
  return left !== null && left.length === right.length && left.every((role, index) => role === right[index])
}

export function BomDimensionMapper({ canManage, code, description }: BomDimensionMapperProps) {
  const tokens = useMemo(() => extractDimensionTokens(description), [description])
  const { mappingQuery, saveMutation } = useBomDimensionMapping(code, description, tokens.length > 0)
  const [draftRoles, setDraftRoles] = useState<DimensionRole[]>(() => suggestDimensionRoles(tokens.length))
  const [confirmed, setConfirmed] = useState<DimensionRole[] | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const justSaved = saveMutation.data?.description === description.trim()
    && (saveMutation.data.code ?? '') === code.trim()

  if (!description.trim()) return <p className="bom-dimensions__hint">No description available for this row.</p>
  if (!tokens.length) return <p className="bom-dimensions__hint">No numbers found in “{description}”.</p>
  if (mappingQuery.isPending) return <p className="bom-dimensions__hint" role="status">Loading saved dimension mapping…</p>
  if (mappingQuery.error && !justSaved) return <div className="bom-dimensions"><p className="form-error" role="alert">Could not load the saved dimension mapping. Changes are disabled until it loads.</p><Button type="button" variant="secondary" onClick={() => void mappingQuery.refetch()}>Retry lookup</Button></div>

  const savedRows = mappingQuery.data ?? []
  const hasSavedMapping = savedRows.length > 0
  const isLocked = hasSavedMapping || justSaved
  const isConfirmed = rolesEqual(confirmed, draftRoles)
  const showApply = canManage && !isLocked && !isConfirmed
  const showSave = canManage && !isLocked && isConfirmed
  const displayed = hasSavedMapping
    ? savedRows.map((row) => ({ index: row.tokenIndex, raw: row.tokenRaw, role: row.role }))
    : tokens.map((token) => ({ index: token.index, raw: token.raw, role: draftRoles[token.index] ?? 'unassigned' }))

  const setRole = (tokenIndex: number, role: DimensionRole) => {
    if (!canManage || isLocked || saveMutation.isPending) return
    setNotice(null)
    saveMutation.reset()
    if (role !== 'unassigned') {
      const takenBy = tokens.find((_token, index) => index !== tokenIndex && draftRoles[index] === role)
      if (takenBy) {
        setError(`“${DIMENSION_ROLE_LABELS[role]}” is already assigned to number ${takenBy.raw}. Each dimension can be used only once.`)
        return
      }
    }
    setError(null)
    setDraftRoles((current) => current.map((existing, index) => index === tokenIndex ? role : existing))
  }

  const applyRoles = () => {
    setConfirmed([...draftRoles])
    setError(null)
    setNotice('Applied — review the result, then Save to lock it in. Nothing has been saved yet.')
  }

  const saveRoles = async () => {
    if (!canManage || isLocked || !isConfirmed || saveMutation.isPending) return
    setNotice(null)
    try {
      await saveMutation.mutateAsync({ code, description, roles: draftRoles })
      setError(null)
      setNotice('Saved in Production Control. This mapping is now locked.')
    } catch {
      // The mutation error is shown below; lookup is refreshed after a failed save.
    }
  }

  if (!hasSavedMapping && !canManage) {
    return <div className="bom-dimensions"><p className="bom-dimensions__source">{description}</p><p className="bom-dimensions__hint">No saved mapping is available. An Admin or Supervisor can assign these dimensions.</p></div>
  }

  return (
    <div className="bom-dimensions">
      <p className="bom-dimensions__source">{description}</p>
      {hasSavedMapping ? <p className="bom-dimensions__hint">{savedRows[0].matchScope === 'description_fallback' ? 'Shared description mapping' : 'Code-specific mapping'} · stored in Production Control</p> : null}
      <table className="bom-dim-table">
        <thead><tr><th scope="col">Number</th><th scope="col">Dimension</th></tr></thead>
        <tbody>
          {displayed.map((token) => (
            <tr key={token.index}>
              <td className="bom-dim-table__number">{token.raw}</td>
              <td>
                {isLocked ? <span className="bom-dim-static">{DIMENSION_ROLE_LABELS[token.role]}</span> : (
                  <Select
                    aria-label={`Dimension for number ${token.raw}`}
                    disabled={saveMutation.isPending}
                    value={token.role}
                    onChange={(event) => setRole(token.index, event.target.value as DimensionRole)}
                  >
                    {DIMENSION_ROLES.map((role) => <option key={role} value={role}>{DIMENSION_ROLE_LABELS[role]}</option>)}
                  </Select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bom-dimensions__actions">
        {showApply ? <Button disabled={saveMutation.isPending} type="button" variant="secondary" onClick={applyRoles}>Apply</Button> : null}
        {showSave ? <Button disabled={saveMutation.isPending} isLoading={saveMutation.isPending} type="button" variant="secondary" onClick={() => void saveRoles()}>Save</Button> : null}
        {isLocked ? <span className="bom-dimensions__locked">Saved ✓</span> : null}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {mappingQuery.error ? <p className="form-error" role="alert">Saved, but the lookup could not be refreshed. <button type="button" onClick={() => void mappingQuery.refetch()}>Retry lookup</button></p> : null}
      {saveMutation.error ? <p className="form-error" role="alert">{saveMutation.error.message} Reload the mapping before retrying if the request outcome is uncertain.</p> : null}
      {notice ? <p className="bom-dimensions__notice" role="status">{notice}</p> : null}
    </div>
  )
}
