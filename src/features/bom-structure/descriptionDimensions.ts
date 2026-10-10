// Pure, order-preserving token helpers. Persisted assignments are fetched and
// saved through the BOM repository; browser storage is not a mapping source.

import type { BomDimensionAssignmentPayload } from './types/bomBackend.types'

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

export function buildDimensionAssignments(description: string, roles: DimensionRole[]): BomDimensionAssignmentPayload[] {
  const tokens = extractDimensionTokens(description)
  if (!tokens.length || roles.length !== tokens.length || roles.some((role) => !DIMENSION_ROLES.includes(role))) {
    throw new Error('Review every description number before saving its dimension mapping.')
  }
  const assignedRoles = roles.filter((role) => role !== 'unassigned')
  if (new Set(assignedRoles).size !== assignedRoles.length) {
    throw new Error('Each dimension can be assigned to only one number.')
  }
  return tokens.map((token) => ({
    token_index: token.index,
    token_raw: token.raw,
    token_value: token.value,
    role: roles[token.index],
  }))
}
