import type { BomItemType } from './types'

export type BomWorkspaceTab = 'structure' | 'extraction'

export interface BomWorkspaceUrlState {
  filters: {
    itemTypes: Set<BomItemType>
    leafOnly: boolean
    level: number | null
    reusedOnly: boolean
    sourceTypes: Set<string>
    unmappedDimensionsOnly: boolean
    warningsOnly: boolean
  }
  focusedNodeId: string | null
  importId: string | null
  nodeId: string | null
  query: string
  tab: BomWorkspaceTab
}

const ITEM_TYPES: BomItemType[] = ['assembly', 'part', 'material']
const SOURCE_TYPES = ['Eigenfertigung', 'Fremdbezug']
const TABS: BomWorkspaceTab[] = ['structure', 'extraction']

function selectedValues<T extends string>(value: string | null, allowed: readonly T[]): Set<T> {
  if (!value) return new Set(allowed)
  if (value === 'none') return new Set()
  const values = value.split(',').filter((entry): entry is T => allowed.includes(entry as T))
  return values.length ? new Set(values) : new Set(allowed)
}

function integerOrNull(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return parsed > 0 && Number.isSafeInteger(parsed) ? parsed : null
}

function selectedParam<T extends string>(value: Set<T>, all: readonly T[]): string | null {
  if (value.size === all.length) return null
  return all.filter((entry) => value.has(entry)).join(',') || 'none'
}

export function readBomWorkspaceUrl(search: URLSearchParams): BomWorkspaceUrlState {
  const tab = search.get('bomTab')
  return {
    focusedNodeId: search.get('focused_node') || null,
    importId: search.get('bomImportId') || null,
    nodeId: search.get('bomNodeId') || null,
    query: search.get('bomQuery') || '',
    tab: TABS.includes(tab as BomWorkspaceTab) ? tab as BomWorkspaceTab : 'structure',
    filters: {
      itemTypes: selectedValues(search.get('bomItemTypes'), ITEM_TYPES),
      leafOnly: search.get('bomLeaf') === '1',
      level: integerOrNull(search.get('bomLevel')),
      reusedOnly: search.get('bomReused') === '1',
      sourceTypes: selectedValues(search.get('bomSourceTypes'), SOURCE_TYPES),
      unmappedDimensionsOnly: search.get('bomUnmappedDimensions') === '1',
      warningsOnly: search.get('bomWarnings') === '1',
    },
  }
}

function setOrDelete(params: URLSearchParams, key: string, value: string | null) {
  if (value) params.set(key, value)
  else params.delete(key)
}

/** Writes only BOM workspace keys, preserving unrelated route state. */
export function writeBomWorkspaceUrl(current: URLSearchParams, state: BomWorkspaceUrlState): URLSearchParams {
  const next = new URLSearchParams(current)
  setOrDelete(next, 'focused_node', state.focusedNodeId)
  setOrDelete(next, 'bomImportId', state.importId)
  setOrDelete(next, 'bomNodeId', state.nodeId)
  setOrDelete(next, 'bomQuery', state.query.trim() || null)
  setOrDelete(next, 'bomTab', state.tab === 'structure' ? null : state.tab)
  setOrDelete(next, 'bomItemTypes', selectedParam(state.filters.itemTypes, ITEM_TYPES))
  setOrDelete(next, 'bomSourceTypes', selectedParam(state.filters.sourceTypes, SOURCE_TYPES))
  setOrDelete(next, 'bomLevel', state.filters.level === null ? null : String(state.filters.level))
  setOrDelete(next, 'bomLeaf', state.filters.leafOnly ? '1' : null)
  setOrDelete(next, 'bomReused', state.filters.reusedOnly ? '1' : null)
  setOrDelete(next, 'bomWarnings', state.filters.warningsOnly ? '1' : null)
  setOrDelete(next, 'bomUnmappedDimensions', state.filters.unmappedDimensionsOnly ? '1' : null)
  return next
}
