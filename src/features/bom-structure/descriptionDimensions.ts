// Pure helpers that split the numbers out of a BOM description such as
// "AKT L 5/90/100/521" so the user can assign each number a meaning.
//
// The Excel file never labels which number is thickness/profile, length,
// width, or height, and the count varies per row — so extraction is
// order-preserving and assignment stays manual in the UI. The resulting
// `DimensionMapping` is the shape a future backend can persist, e.g. as
// nullable numeric columns (thickness_mm, length_mm, width_mm, height_mm)
// on a BOM/part table. Nothing here writes to any database.

export type DimensionRole = 'profile' | 'length' | 'width' | 'height' | 'unassigned'

export interface DimensionToken {
  /** Position of the token inside the description (0-based). */
  index: number
  /** Exact text as written, e.g. "5,5". */
  raw: string
  /** Numeric value with decimal comma normalized, or null when unparsable. */
  value: number | null
}

export interface DimensionAssignment {
  role: DimensionRole
  token: DimensionToken
}

export interface DimensionMapping {
  assignments: DimensionAssignment[]
  /** Description the tokens were extracted from. */
  description: string
}

export const DIMENSION_ROLES: DimensionRole[] = ['profile', 'length', 'width', 'height', 'unassigned']

export const DIMENSION_ROLE_LABELS: Record<DimensionRole, string> = {
  height: 'Height',
  length: 'Length',
  profile: 'Profile / Thickness',
  unassigned: 'Ignore',
  width: 'Width',
}

export const DIMENSION_ROLE_SHORT_LABELS: Record<DimensionRole, string> = {
  height: 'Height',
  length: 'Length',
  profile: 'Profile',
  unassigned: 'Ignore',
  width: 'Width',
}

const NUMBER_PATTERN = /\d+(?:[.,]\d+)?/g

export function extractDimensionTokens(description: string): DimensionToken[] {
  const tokens: DimensionToken[] = []
  for (const match of description.matchAll(NUMBER_PATTERN)) {
    const raw = match[0]
    const parsed = Number.parseFloat(raw.replace(',', '.'))
    tokens.push({
      index: tokens.length,
      raw,
      value: Number.isFinite(parsed) ? parsed : null,
    })
  }
  return tokens
}

/** Default suggestion: first tokens in profile → length → width → height order, rest ignored. */
export function suggestDimensionRoles(tokenCount: number): DimensionRole[] {
  const preferred: DimensionRole[] = ['profile', 'length', 'width', 'height']
  return Array.from({ length: tokenCount }, (_, index) => preferred[index] ?? 'unassigned')
}

export function buildDimensionMapping(description: string, roles: DimensionRole[]): DimensionMapping {
  const tokens = extractDimensionTokens(description)
  return {
    assignments: tokens.map((token, index) => ({ role: roles[index] ?? 'unassigned', token })),
    description,
  }
}

const STORAGE_PREFIX = 'bom-dimension-roles:'

/** Storage key for a row mapping. Falls back to the description when the row has no code. */
export function buildDimensionStorageKey(code: string, description: string): string {
  const basis = code.trim() || description.trim() || 'unknown'
  return `${STORAGE_PREFIX}${basis.toLocaleLowerCase()}`
}

/** Roles array fitted to the current token count (pads with 'unassigned', trims extras). */
export function fitRolesToTokens(roles: DimensionRole[], tokenCount: number): DimensionRole[] {
  return Array.from({ length: tokenCount }, (_, index) => roles[index] ?? 'unassigned')
}

function isDimensionRole(value: unknown): value is DimensionRole {
  return typeof value === 'string' && (DIMENSION_ROLES as string[]).includes(value)
}

export function loadSavedDimensionRoles(storageKey: string): DimensionRole[] | null {
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return null
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed) || !parsed.every(isDimensionRole)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveDimensionRoles(storageKey: string, roles: DimensionRole[]): boolean {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(roles))
    return true
  } catch {
    return false
  }
}
