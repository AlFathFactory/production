import { useEffect } from 'react'

import type { VisibleBomNode } from '../bomTree'
import type { BomNode } from '../types'

interface BomTreeProps {
  expandedIds: Set<string>
  onSelect: (node: BomNode) => void
  onToggle: (node: BomNode) => void
  query: string
  revealId: string | null
  selectedId: string | null
  visibleNodes: VisibleBomNode[]
}

function Highlight({ children, query }: { children: string; query: string }) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const index = normalizedQuery ? children.toLocaleLowerCase().indexOf(normalizedQuery) : -1
  if (index < 0) return <>{children}</>
  return <>{children.slice(0, index)}<mark>{children.slice(index, index + normalizedQuery.length)}</mark>{children.slice(index + normalizedQuery.length)}</>
}

export function BomTree({
  expandedIds,
  onSelect,
  onToggle,
  query,
  revealId,
  selectedId,
  visibleNodes,
}: BomTreeProps) {
  useEffect(() => {
    if (!revealId) return
    document.getElementById(`bom-tree-${revealId}`)?.scrollIntoView({ block: 'center' })
  }, [revealId, visibleNodes])

  return (
    <div className="bom-tree" role="tree" aria-label="BOM hierarchy">
      <div className="bom-tree__header" aria-hidden="true">
        <span>Level</span><span>Structure / Code</span><span>Description</span>
      </div>
      <div className="bom-tree__rows">
        {visibleNodes.map(({ isMatch, node }) => {
          const isExpanded = expandedIds.has(node.id)
          return (
            <div
              aria-level={node.level}
              aria-selected={selectedId === node.id}
              className={`bom-tree-row bom-tree-row--level-${((node.level - 1) % 6) + 1}${node.isLeaf ? ' bom-tree-row--leaf-node' : ''}${selectedId === node.id ? ' bom-tree-row--selected' : ''}${isMatch ? ' bom-tree-row--match' : ''}`}
              id={`bom-tree-${node.id}`}
              key={node.id}
              role="treeitem"
              onDoubleClick={() => node.children.length && onToggle(node)}
            >
              <span className="bom-tree-row__level">{node.level}</span>
              <div className="bom-tree-row__structure" style={{ paddingInlineStart: `${Math.max(0, node.level - 1) * 18 + 10}px` }}>
                <span className="bom-tree-row__guides" aria-hidden="true">
                  {Array.from({ length: Math.max(0, node.level - 1) }, (_, index) => (
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
            </div>
          )
        })}
        {visibleNodes.length === 0 ? <div className="bom-tree__empty">No BOM nodes match the current search and filters.</div> : null}
      </div>
    </div>
  )
}
