import { useEffect, useMemo, useState } from 'react'

import { PageHeader } from '../../components/shared/PageHeader'
import { getAncestorIds, getVisibleBomNodes } from './bomTree'
import { BomDetails } from './components/BomDetails'
import { BomFilePicker } from './components/BomFilePicker'
import { BomSummary } from './components/BomSummary'
import { BomToolbar } from './components/BomToolbar'
import { BomTree } from './components/BomTree'
import { RolledUpParts } from './components/RolledUpParts'
import { useBomWorkbook } from './hooks/useBomWorkbook'
import type { BomItemType, BomNode } from './types'
import './BomStructurePage.css'

const ALL_ITEM_TYPES = new Set<BomItemType>(['assembly', 'part', 'material'])
const ALL_SOURCE_TYPES = new Set(['Eigenfertigung', 'Fremdbezug'])

export function BomStructurePage() {
  const workbook = useBomWorkbook()
  const [activeView, setActiveView] = useState<'structure' | 'rollup'>('structure')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [revealId, setRevealId] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<BomNode | null>(null)
  const result = workbook.result

  const nodesById = useMemo(
    () => new Map(result?.nodes.map((node) => [node.id, node]) ?? []),
    [result],
  )
  const visibleNodes = useMemo(
    () => result
      ? getVisibleBomNodes(result.roots, expandedIds, {
          itemTypes: ALL_ITEM_TYPES,
          query,
          sourceTypes: ALL_SOURCE_TYPES,
        })
      : [],
    [expandedIds, query, result],
  )

  useEffect(() => {
    if (!result) return
    setActiveView('structure')
    setExpandedIds(new Set(
      result.nodes.filter((node) => node.children.length).map((node) => node.id),
    ))
    setIsDetailsOpen(false)
    setQuery('')
    setRevealId(null)
    setSelectedNode(null)
  }, [result])

  const toggleExpanded = (node: BomNode) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(node.id)) next.delete(node.id)
      else next.add(node.id)
      return next
    })
  }

  const revealNode = (node: BomNode) => {
    setActiveView('structure')
    setExpandedIds((current) => new Set([
      ...current,
      ...getAncestorIds(node, nodesById),
    ]))
    setSelectedNode(node)
    setIsDetailsOpen(true)
    setRevealId(node.id)
  }

  const expandToLevel = (level: number) => {
    if (!result) return
    setExpandedIds(new Set(
      result.nodes
        .filter((node) => node.children.length && node.level < level)
        .map((node) => node.id),
    ))
  }

  const expandAll = () => {
    if (!result) return
    setExpandedIds(new Set(
      result.nodes.filter((node) => node.children.length).map((node) => node.id),
    ))
  }

  const selectNode = (node: BomNode) => {
    setSelectedNode(node)
    setIsDetailsOpen(true)
    setRevealId(null)
  }

  return (
    <>
      <PageHeader
        title="BOM Structure Explorer"
        description="Parse, inspect, and validate Penta BOM hierarchy without importing anything into Production."
      />
      <div className="bom-page">
        <BomFilePicker {...workbook} onFileSelect={workbook.selectFile} />
        {!result ? (
          <section className="bom-empty-state">
            <div className="bom-empty-state__diagram" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
            <h2>Inspect a BOM before it reaches Production</h2>
            <p>
              The explorer detects the <strong>Stufe</strong> header, rebuilds hierarchy from
              row order and level, compares cumulative quantities, and keeps every repeated
              occurrence in context.
            </p>
          </section>
        ) : (
          <>
            <div className="bom-result-meta">
              <span><strong>{result.sheetName}</strong> · header detected at Excel row {result.headerRow}</span>
              <span>{visibleNodes.length.toLocaleString('en-US')} of {result.nodes.length.toLocaleString('en-US')} rows visible</span>
            </div>
            <BomSummary summary={result.summary} />
            <div className="bom-view-tabs" role="tablist" aria-label="BOM views">
              <button
                aria-selected={activeView === 'structure'}
                role="tab"
                type="button"
                onClick={() => setActiveView('structure')}
              >Structure Explorer</button>
              <button
                aria-selected={activeView === 'rollup'}
                role="tab"
                type="button"
                onClick={() => setActiveView('rollup')}
              >
                Rolled-up Parts <span>{result.rolledUpParts.length.toLocaleString('en-US')}</span>
              </button>
            </div>
            {activeView === 'structure' ? (
              <>
                <BomToolbar
                  maxLevel={result.summary.levels}
                  query={query}
                  onCollapseAll={() => setExpandedIds(new Set())}
                  onExpandAll={expandAll}
                  onExpandLevel={expandToLevel}
                  onQueryChange={setQuery}
                />
                <div className={`bom-explorer${selectedNode && isDetailsOpen ? ' bom-explorer--details-open' : ''}`}>
                  <BomTree
                    expandedIds={expandedIds}
                    query={query}
                    revealId={revealId}
                    selectedId={selectedNode?.id ?? null}
                    visibleNodes={visibleNodes}
                    onSelect={selectNode}
                    onToggle={toggleExpanded}
                  />
                  {selectedNode && isDetailsOpen ? (
                    <BomDetails
                      byCode={result.byCode}
                      node={selectedNode}
                      nodesById={nodesById}
                      onClose={() => setIsDetailsOpen(false)}
                      onNavigate={revealNode}
                    />
                  ) : null}
                </div>
              </>
            ) : (
              <RolledUpParts parts={result.rolledUpParts} />
            )}
          </>
        )}
        {result ? (
          <div className="bom-local-only">
            <span aria-hidden="true">●</span> Preview only · in-memory · no database writes
          </div>
        ) : null}
      </div>
    </>
  )
}
