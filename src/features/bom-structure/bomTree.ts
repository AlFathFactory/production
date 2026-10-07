import type { BomItemType, BomNode } from './types'

export interface BomTreeFilters {
  itemTypes: Set<BomItemType>
  query: string
  sourceTypes: Set<string>
}

export interface VisibleBomNode {
  isMatch: boolean
  node: BomNode
}

const FILTERABLE_ITEM_TYPES: BomItemType[] = ['assembly', 'part', 'material']
const FILTERABLE_SOURCE_TYPES = ['Eigenfertigung', 'Fremdbezug']

function matches(node: BomNode, filters: BomTreeFilters): boolean {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase()
  const allTypesSelected = FILTERABLE_ITEM_TYPES.every((type) => filters.itemTypes.has(type))
  const allSourcesSelected = FILTERABLE_SOURCE_TYPES.every((source) => filters.sourceTypes.has(source))
  const typeMatches = allTypesSelected || filters.itemTypes.has(node.itemType)
  const sourceMatches = allSourcesSelected || filters.sourceTypes.has(node.sourceType)
  const textMatches = !normalizedQuery || [node.code, node.name, node.name2, node.material, node.drawingNumber]
    .some((value) => value.toLocaleLowerCase().includes(normalizedQuery))
  return typeMatches && sourceMatches && textMatches
}

export function getVisibleBomNodes(
  roots: BomNode[],
  expandedIds: Set<string>,
  filters: BomTreeFilters,
): VisibleBomNode[] {
  const included = new Set<string>()
  const directMatches = new Set<string>()
  const hasActiveCriteria = Boolean(filters.query.trim())
    || !FILTERABLE_ITEM_TYPES.every((type) => filters.itemTypes.has(type))
    || !FILTERABLE_SOURCE_TYPES.every((source) => filters.sourceTypes.has(source))

  function mark(node: BomNode): boolean {
    const isDirectMatch = matches(node, filters)
    if (isDirectMatch) directMatches.add(node.id)
    let hasMatchingDescendant = false
    for (const child of node.children) {
      if (mark(child)) hasMatchingDescendant = true
    }
    if (isDirectMatch || hasMatchingDescendant) included.add(node.id)
    return isDirectMatch || hasMatchingDescendant
  }
  roots.forEach(mark)

  const visible: VisibleBomNode[] = []
  function collect(node: BomNode) {
    if (!included.has(node.id)) return
    visible.push({ isMatch: hasActiveCriteria && directMatches.has(node.id), node })
    const hasIncludedDescendant = node.children.some((child) => included.has(child.id))
    if (expandedIds.has(node.id) || (hasActiveCriteria && hasIncludedDescendant)) {
      node.children.forEach(collect)
    }
  }
  roots.forEach(collect)
  return visible
}

export function getAncestorIds(node: BomNode, nodesById: Map<string, BomNode>): string[] {
  const ids: string[] = []
  let parentId = node.parentId
  while (parentId) {
    ids.push(parentId)
    parentId = nodesById.get(parentId)?.parentId ?? null
  }
  return ids
}

export function countDescendants(node: BomNode): number {
  return node.children.reduce((total, child) => total + 1 + countDescendants(child), 0)
}
