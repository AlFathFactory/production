import { memo, useEffect, useState, type KeyboardEvent } from 'react'

import type { VisibleBomNode } from '../bomTree'
import { BOM_TREE_RENDER_STEP } from '../bomSettings'
import type { BomNode } from '../types'

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 })

function unitWeight(node: BomNode): number | null {
  if (node.positionWeightKg === null || node.quantityPerParent === 0) return null
  return node.positionWeightKg / node.quantityPerParent
}

interface BomTreeProps {
  expandedIds: Set<string>
  levelOffset?: number
  onSelect: (node: BomNode) => void
  onToggle: (node: BomNode) => void
  query: string
  revealId: string | null
  selectedId: string | null
  visibleNodes: VisibleBomNode[]
}

// Incremental rendering keeps large BOMs (thousands of rows) responsive:
// only the first slice mounts, collapsed branches never render, and rows
// below memoize on their own props instead of the whole tree.

function Highlight({ children, query }: { children: string; query: string }) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const index = normalizedQuery ? children.toLocaleLowerCase().indexOf(normalizedQuery) : -1
  if (index < 0) return <>{children}</>
  return <>{children.slice(0, index)}<mark>{children.slice(index, index + normalizedQuery.length)}</mark>{children.slice(index + normalizedQuery.length)}</>
}

interface BomTreeRowProps {
  isExpanded: boolean
  isMatch: boolean
  isSelected: boolean
  isTabStop: boolean
  level: number
  node: BomNode
  query: string
  onSelect: (node: BomNode) => void
  onToggle: (node: BomNode) => void
}

const BomTreeRow = memo(function BomTreeRow({ isExpanded, isMatch, isSelected, isTabStop, level, node, onSelect, onToggle, query }: BomTreeRowProps) {
  const unitWeightKg = unitWeight(node)
  return (
    <div
      aria-level={level}
      aria-expanded={node.children.length ? isExpanded : undefined}
      aria-label={`${node.code || 'Unnamed node'}: ${node.name || 'No description'}`}
      aria-selected={isSelected}
      className={`bom-tree-row bom-tree-row--level-${((level - 1) % 6) + 1}${node.isLeaf ? ' bom-tree-row--leaf-node' : ''}${isSelected ? ' bom-tree-row--selected' : ''}${isMatch ? ' bom-tree-row--match' : ''}`}
      id={`bom-tree-${node.id}`}
      role="treeitem"
      tabIndex={isTabStop ? 0 : -1}
      onDoubleClick={() => node.children.length && onToggle(node)}
    >
      <span className="bom-tree-row__level">{level}</span>
      <div className="bom-tree-row__structure" style={{ paddingInlineStart: `${Math.max(0, level - 1) * 18 + 10}px` }}>
        <span className="bom-tree-row__guides" aria-hidden="true">
          {Array.from({ length: Math.max(0, level - 1) }, (_, index) => (
            <span key={index} style={{ insetInlineStart: `${index * 18 + 18}px` }} />
          ))}
        </span>
        {node.children.length ? (
          <button
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.code || 'node'}`}
            aria-expanded={isExpanded}
            className="bom-tree-row__toggle"
            type="button"
            onClick={() => onToggle(node)}
          ><span aria-hidden="true">›</span></button>
        ) : <span className="bom-tree-row__leaf" aria-hidden="true" />}
        <button className="bom-tree-row__select" type="button" onClick={() => onSelect(node)}>
          <Highlight query={query}>{node.code || '—'}</Highlight>
        </button>
        {node.reuseCount > 1 ? <span className="bom-tree-row__reuse" title={`Used ${node.reuseCount} times in BOM`}>×{node.reuseCount}</span> : null}
      </div>
      <button className="bom-tree-row__description" type="button" onClick={() => onSelect(node)}>
        <Highlight query={query}>{node.name || '—'}</Highlight>
        {node.name2 ? <small><Highlight query={query}>{node.name2}</Highlight></small> : null}
      </button>
      <span className="bom-tree-row__metric bom-number" title="Cumulative quantity">{number.format(node.calculatedCumulativeQuantity)}</span>
      <span className="bom-tree-row__metric bom-number" title="Per-piece weight">
        {unitWeightKg === null ? '—' : `${number.format(unitWeightKg)} kg`}
      </span>
      <span className="bom-tree-row__metric bom-number bom-number--total" title="Total rolled weight">{number.format(node.rolledWeightKg)} kg</span>
    </div>
  )
})

export const BomTree = memo(function BomTree({
  expandedIds,
  levelOffset = 0,
  onSelect,
  onToggle,
  query,
  revealId,
  selectedId,
  visibleNodes,
}: BomTreeProps) {
  const [limit, setLimit] = useState(BOM_TREE_RENDER_STEP)

  useEffect(() => {
    setLimit(BOM_TREE_RENDER_STEP)
  }, [query])

  useEffect(() => {
    if (!revealId) return
    const index = visibleNodes.findIndex(({ node }) => node.id === revealId)
    if (index >= 0) {
      if (index >= limit) setLimit(index + BOM_TREE_RENDER_STEP)
      document.getElementById(`bom-tree-${revealId}`)?.scrollIntoView({ block: 'center' })
    }
  }, [limit, revealId, visibleNodes])

  const rendered = visibleNodes.slice(0, limit)
  const displayLevel = (node: BomNode) => Math.max(1, node.level - levelOffset)
  const tabStopId = rendered.find(({ node }) => node.id === selectedId)?.node.id ?? rendered[0]?.node.id
  const onTreeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[role="treeitem"]')
    if (!row || !event.currentTarget.contains(row)) return
    const index = rendered.findIndex(({ node }) => row.id === `bom-tree-${node.id}`)
    if (index < 0) return
    const node = rendered[index].node
    let focusId: string | null = null
    if (event.key === 'ArrowDown') focusId = rendered[index + 1]?.node.id ?? null
    else if (event.key === 'ArrowUp') focusId = rendered[index - 1]?.node.id ?? null
    else if (event.key === 'ArrowRight' && node.children.length) {
      if (!expandedIds.has(node.id)) onToggle(node)
      else if (rendered[index + 1] && displayLevel(rendered[index + 1].node) > displayLevel(node)) focusId = rendered[index + 1].node.id
    }
    else if (event.key === 'ArrowLeft') {
      if (node.children.length && expandedIds.has(node.id)) onToggle(node)
      else focusId = rendered.slice(0, index).reverse().find(({ node: candidate }) => displayLevel(candidate) === displayLevel(node) - 1)?.node.id ?? null
    } else if ((event.key === 'Enter' || event.key === ' ') && event.target === row) onSelect(node)
    else return
    event.preventDefault()
    if (focusId) document.getElementById(`bom-tree-${focusId}`)?.focus()
  }

  return (
    <div className="bom-tree" role="tree" aria-label="BOM hierarchy" aria-describedby="bom-tree-keyboard-help" onKeyDown={onTreeKeyDown}>
      <p className="sr-only" id="bom-tree-keyboard-help">Use up and down arrows to move between rows, right and left arrows to expand or collapse, and Enter to open details.</p>
      <div className="bom-tree__header" aria-hidden="true">
        <span>Level</span><span>Structure / Code</span><span>Description</span><span>Quantity</span><span>Unit weight</span><span>Total weight</span>
      </div>
      <div className="bom-tree__rows">
        {rendered.map(({ isMatch, node }) => (
          <BomTreeRow
            key={node.id}
            isExpanded={expandedIds.has(node.id)}
            isMatch={isMatch}
            isSelected={selectedId === node.id}
            isTabStop={tabStopId === node.id}
            level={displayLevel(node)}
            node={node}
            onSelect={onSelect}
            onToggle={onToggle}
            query={query}
          />
        ))}
        {visibleNodes.length === 0 ? <div className="bom-tree__empty">No BOM nodes match the current search and filters.</div> : null}
        {visibleNodes.length > rendered.length ? (
          <div className="bom-tree__more">
            <p role="status">Showing {rendered.length.toLocaleString('en-US')} of {visibleNodes.length.toLocaleString('en-US')} rows.</p>
            <button type="button" onClick={() => setLimit((current) => current + BOM_TREE_RENDER_STEP)}>
              Show more rows
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
})
