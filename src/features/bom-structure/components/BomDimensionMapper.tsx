import { useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import {
  DIMENSION_ROLE_LABELS,
  DIMENSION_ROLES,
  buildDimensionStorageKey,
  extractDimensionTokens,
  fitRolesToTokens,
  loadSavedDimensionRoles,
  saveDimensionRoles,
  suggestDimensionRoles,
  type DimensionRole,
} from '../descriptionDimensions'

interface BomDimensionMapperProps {
  code: string
  description: string
}

function rolesEqual(left: DimensionRole[] | null, right: DimensionRole[]): boolean {
  return left !== null && left.length === right.length && left.every((role, index) => role === right[index])
}

export function BomDimensionMapper({ code, description }: BomDimensionMapperProps) {
  const tokens = extractDimensionTokens(description)
  const storageKey = buildDimensionStorageKey(code, description)
  const [roles, setRoles] = useState<DimensionRole[]>(() => {
    const saved = loadSavedDimensionRoles(storageKey)
    return fitRolesToTokens(saved ?? suggestDimensionRoles(tokens.length), tokens.length)
  })
  // Last confirmed (Apply) assignment, or null while nothing is confirmed yet.
  const [confirmed, setConfirmed] = useState<DimensionRole[] | null>(() => {
    const saved = loadSavedDimensionRoles(storageKey)
    return saved ? fitRolesToTokens(saved, tokens.length) : null
  })
  // Once saved, the mapping is locked and can no longer be changed.
  const [isLocked, setIsLocked] = useState(() => loadSavedDimensionRoles(storageKey) !== null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!description.trim()) {
    return <p className="bom-dimensions__hint">No description available for this row.</p>
  }
  if (tokens.length === 0) {
    return <p className="bom-dimensions__hint">No numbers found in “{description}”.</p>
  }

  const isConfirmed = rolesEqual(confirmed, roles)
  const showApply = !isLocked && !isConfirmed
  const showSave = !isLocked && isConfirmed

  const setRole = (tokenIndex: number, role: DimensionRole) => {
    if (isLocked) return
    setNotice(null)
    if (role !== 'unassigned') {
      const takenBy = tokens.find(
        (_token, index) => index !== tokenIndex && roles[index] === role,
      )
      if (takenBy) {
        setError(`“${DIMENSION_ROLE_LABELS[role]}” is already assigned to number ${takenBy.raw}. Each dimension can be used only once.`)
        return
      }
    }
    setError(null)
    setRoles((current) => current.map((existing, index) => (index === tokenIndex ? role : existing)))
  }

  const applyRoles = () => {
    setConfirmed(roles)
    setError(null)
    setNotice('Applied — review the result, then Save to lock it in.')
  }

  const saveRoles = () => {
    if (!saveDimensionRoles(storageKey, roles)) {
      setNotice('The mapping could not be saved in this browser.')
      return
    }
    setIsLocked(true)
    setError(null)
    setNotice('Saved and locked — this mapping can no longer be changed.')
  }

  return (
    <div className="bom-dimensions">
      <p className="bom-dimensions__source">{description}</p>
      <table className="bom-dim-table">
        <thead>
          <tr><th scope="col">Number</th><th scope="col">Dimension</th></tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.index}>
              <td className="bom-dim-table__number">{token.raw}</td>
              <td>
                {isLocked ? (
                  <span className="bom-dim-static">
                    {DIMENSION_ROLE_LABELS[roles[token.index] ?? 'unassigned']}
                  </span>
                ) : (
                  <Select
                    aria-label={`Dimension for number ${token.raw}`}
                    value={roles[token.index] ?? 'unassigned'}
                    onChange={(event) => setRole(token.index, event.target.value as DimensionRole)}
                  >
                    {DIMENSION_ROLES.map((role) => (
                      <option key={role} value={role}>{DIMENSION_ROLE_LABELS[role]}</option>
                    ))}
                  </Select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bom-dimensions__actions">
        {showApply ? (
          <Button type="button" variant="secondary" onClick={applyRoles}>
            Apply
          </Button>
        ) : null}
        {showSave ? (
          <Button type="button" variant="secondary" onClick={saveRoles}>
            Save
          </Button>
        ) : null}
        {isLocked ? <span className="bom-dimensions__locked">Saved ✓</span> : null}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {notice ? <p className="bom-dimensions__notice" role="status">{notice}</p> : null}
    </div>
  )
}
