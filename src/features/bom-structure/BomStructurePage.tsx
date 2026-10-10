import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { PageHeader } from '../../components/shared/PageHeader'
import { useAuth } from '../auth/hooks/useAuth'
import { canManageBomImports } from '../auth/permissions'
import { getAncestorIds, getVisibleBomNodes } from './bomTree'
import { BomDetails } from './components/BomDetails'
import { BomFilePicker } from './components/BomFilePicker'
import { BomImportSelector } from './components/BomImportSelector'
import { BomImportPreparation } from './components/BomImportPreparation'
import { BomSaveReview } from './components/BomSaveReview'
import { BomSummary } from './components/BomSummary'
import { BomToolbar } from './components/BomToolbar'
import { BomTree } from './components/BomTree'
import { BomWarnings } from './components/BomWarnings'
import { RolledUpParts } from './components/RolledUpParts'
import { useBomImportPreparation } from './hooks/useBomImportPreparation'
import { useBomNodeSave } from './hooks/useBomNodeSave'
import { useBomWorkbook } from './hooks/useBomWorkbook'
import { useBomImports } from './queries/useBomImports'
import {
  useBomImport,
  useBomNodeDetails,
  useBomRolledUpParts,
  useBomSummary,
  useBomTree,
  useBomWarnings,
} from './queries/usePersistedBom'
import type { BomItemType, BomNode, BomParseResult } from './types'
import './BomStructurePage.css'

const ALL_ITEM_TYPES = new Set<BomItemType>(['assembly', 'part', 'material'])
const ALL_SOURCE_TYPES = new Set(['Eigenfertigung', 'Fremdbezug'])

type WorkspaceData = Pick<BomParseResult, 'byCode' | 'headerRow' | 'nodes' | 'rolledUpParts' | 'roots' | 'sheetName' | 'summary' | 'warnings'>

export function BomStructurePage() {
  const workbook = useBomWorkbook()
  const preparation = useBomImportPreparation()
  const saving = useBomNodeSave()
  const { userProfile } = useAuth()
  const canManageImports = Boolean(userProfile?.is_active && canManageBomImports(userProfile.role))
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedImportId = searchParams.get('bomImportId') || null
  const [activeView, setActiveView] = useState<'structure' | 'rollup'>('structure')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [importSearch, setImportSearch] = useState('')
  const [query, setQuery] = useState('')
  const [revealId, setRevealId] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<BomNode | null>(null)
  const importsQuery = useBomImports({ search: importSearch })
  const importQuery = useBomImport(selectedImportId)
  const selectedImport = importQuery.data
  const isPersisted = selectedImport?.status === 'saved' || selectedImport?.status === 'superseded'
  const treeQuery = useBomTree(selectedImportId, isPersisted)
  const summaryQuery = useBomSummary(selectedImportId, isPersisted)
  const warningsQuery = useBomWarnings(selectedImportId, isPersisted)
  const rollupsQuery = useBomRolledUpParts(selectedImportId, isPersisted)
  const activePreview = !isPersisted && workbook.result
    && (!selectedImportId || selectedImportId === preparation.attempt?.importItem.id)
    ? workbook.result : null

  const persistedWorkspace = useMemo<WorkspaceData | null>(() => {
    if (!isPersisted || !treeQuery.data || !summaryQuery.data || !warningsQuery.data || !rollupsQuery.data) return null
    const nodes = treeQuery.data.nodes
    const byCode = new Map<string, BomNode[]>()
    for (const node of nodes) byCode.set(node.code, [...(byCode.get(node.code) ?? []), node])
    return {
      byCode,
      headerRow: selectedImport?.headerRow ?? 0,
      nodes,
      rolledUpParts: rollupsQuery.data,
      roots: treeQuery.data.roots,
      sheetName: selectedImport?.sheetName ?? selectedImport?.fileName ?? 'Saved BOM',
      summary: summaryQuery.data,
      warnings: warningsQuery.data,
    }
  }, [isPersisted, rollupsQuery.data, selectedImport, summaryQuery.data, treeQuery.data, warningsQuery.data])
  const view = persistedWorkspace ?? activePreview
  const nodesById = useMemo(() => new Map(view?.nodes.map((node) => [node.id, node]) ?? []), [view])
  const currentNode = selectedNode ? nodesById.get(selectedNode.id) ?? null : null
  const detailsQuery = useBomNodeDetails(currentNode?.id ?? null, Boolean(isPersisted && isDetailsOpen))
  const detailNode = isPersisted && currentNode && detailsQuery.data
    ? { ...currentNode, ...detailsQuery.data, children: currentNode.children, isLeaf: currentNode.isLeaf, reuseCount: currentNode.reuseCount }
    : currentNode
  const visibleNodes = useMemo(() => view
    ? getVisibleBomNodes(view.roots, expandedIds, {
        itemTypes: ALL_ITEM_TYPES,
        query,
        sourceTypes: ALL_SOURCE_TYPES,
      })
    : [], [expandedIds, query, view])

  useEffect(() => {
    if (!view) return
    setActiveView('structure')
    setExpandedIds(new Set(view.nodes.filter((node) => node.children.length).map((node) => node.id)))
    setIsDetailsOpen(false)
    setQuery('')
    setRevealId(null)
    setSelectedNode(null)
  }, [view])

  const selectImport = (importId: string | null) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (importId) next.set('bomImportId', importId)
      else next.delete('bomImportId')
      return next
    })
  }

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
    setExpandedIds((current) => new Set([...current, ...getAncestorIds(node, nodesById)]))
    setSelectedNode(node)
    setIsDetailsOpen(true)
    setRevealId(node.id)
  }

  const expandToLevel = (level: number) => {
    if (!view) return
    setExpandedIds(new Set(view.nodes.filter((node) => node.children.length && node.level < level).map((node) => node.id)))
  }

  const expandAll = () => {
    if (!view) return
    setExpandedIds(new Set(view.nodes.filter((node) => node.children.length).map((node) => node.id)))
  }

  const selectFile = async (file: File) => {
    if (preparation.isBusy || saving.isBusy || (preparation.attempt && !preparation.isComplete)) return
    preparation.reset()
    saving.reset()
    selectImport(null)
    await workbook.selectFile(file)
  }

  const persistedError = [treeQuery, summaryQuery, warningsQuery, rollupsQuery]
    .map((state) => state.error).find(Boolean)
  const missingPersistedData = isPersisted && [treeQuery, summaryQuery, warningsQuery, rollupsQuery]
    .every((state) => state.isSuccess) && !persistedWorkspace
  const loadingPersisted = isPersisted && !persistedWorkspace && !persistedError && !missingPersistedData

  return (
    <>
      <PageHeader
        title="BOM Structure Explorer"
        description="Parse and inspect a Penta BOM locally, then validate and save it as a versioned Production Control import."
      />
      <div className="bom-page">
        {canManageImports ? (
          <BomFilePicker
            {...workbook}
            disabled={preparation.isBusy || saving.isBusy || Boolean(preparation.attempt && !preparation.isComplete)}
            onFileSelect={selectFile}
          />
        ) : null}
        <BomImportSelector
          error={importsQuery.error instanceof Error ? importsQuery.error.message : importsQuery.error ? 'Unable to load saved BOM imports.' : null}
          imports={importsQuery.data ?? []}
          isLoading={importsQuery.isPending}
          search={importSearch}
          selectedImport={selectedImport}
          selectedImportId={selectedImportId}
          onRetry={() => void importsQuery.refetch()}
          onSearchChange={setImportSearch}
          onSelect={(importId) => selectImport(importId || null)}
        />
        {selectedImportId && importQuery.error ? <div className="bom-state-message" role="alert">Unable to load this import. <button type="button" onClick={() => void importQuery.refetch()}>Retry</button></div> : null}
        {selectedImportId && importQuery.isPending ? <div className="bom-state-message" role="status">Loading import…</div> : null}
        {selectedImportId && importQuery.isSuccess && !selectedImport ? <div className="bom-state-message" role="alert">This BOM import is not available.</div> : null}
        {canManageImports && activePreview && workbook.sourceFile ? (
          <BomImportPreparation
            file={workbook.sourceFile}
            preparation={preparation}
            result={activePreview}
            onAttached={(importId) => {
              setImportSearch('')
              selectImport(importId)
            }}
          />
        ) : null}
        {canManageImports && activePreview && preparation.isComplete && preparation.attempt
          && (!selectedImportId || selectedImportId === preparation.attempt.importItem.id) ? (
          <BomSaveReview
            importId={preparation.attempt.importItem.id}
            result={activePreview}
            saving={saving}
            onSaved={(importId) => selectImport(importId)}
          />
        ) : null}
        {selectedImport?.status === 'parsed' && !activePreview ? (
          <div className="bom-state-message">This import has an attached source, but its structure is not saved. Reopen the original workbook to continue preparing it.</div>
        ) : null}
        {selectedImport?.status === 'failed' ? <div className="bom-state-message">This import failed and has no saved structure to display.</div> : null}
        {loadingPersisted ? <div className="bom-state-message" role="status">Loading saved tree, summary, warnings, and rolled-up parts…</div> : null}
        {persistedError ? <div className="bom-state-message" role="alert">Could not load the saved BOM. <button type="button" onClick={() => {
          void treeQuery.refetch(); void summaryQuery.refetch(); void warningsQuery.refetch(); void rollupsQuery.refetch()
        }}>Retry</button></div> : null}
        {missingPersistedData ? <div className="bom-state-message" role="alert">This import is marked saved, but its backend summary or structure is missing. Please review the import before proceeding.</div> : null}
        {!view && !selectedImportId ? (
          <section className="bom-empty-state">
            <div className="bom-empty-state__diagram" aria-hidden="true"><span /><span /><span /><span /></div>
            <h2>Inspect a BOM before it reaches Production</h2>
            <p>The explorer detects the <strong>Stufe</strong> header, rebuilds hierarchy from row order and level, compares cumulative quantities, and keeps every repeated occurrence in context.</p>
          </section>
        ) : null}
        {view ? (
          <>
            <div className="bom-result-meta">
              <span><strong>{view.sheetName}</strong> · {isPersisted ? `saved import v${selectedImport?.versionNumber}` : `header detected at Excel row ${view.headerRow}`}</span>
              <span>{visibleNodes.length.toLocaleString('en-US')} of {view.nodes.length.toLocaleString('en-US')} rows visible</span>
            </div>
            <BomSummary summary={view.summary} />
            <BomWarnings persisted={isPersisted} warnings={view.warnings} />
            <div className="bom-view-tabs" role="tablist" aria-label="BOM views">
              <button aria-selected={activeView === 'structure'} role="tab" type="button" onClick={() => setActiveView('structure')}>Structure Explorer</button>
              <button aria-selected={activeView === 'rollup'} role="tab" type="button" onClick={() => setActiveView('rollup')}>Rolled-up Parts <span>{view.rolledUpParts.length.toLocaleString('en-US')}</span></button>
            </div>
            {activeView === 'structure' ? (
              <>
                <BomToolbar
                  maxLevel={view.summary.levels}
                  query={query}
                  onCollapseAll={() => setExpandedIds(new Set())}
                  onExpandAll={expandAll}
                  onExpandLevel={expandToLevel}
                  onQueryChange={setQuery}
                />
                <div className={`bom-explorer${currentNode && isDetailsOpen ? ' bom-explorer--details-open' : ''}`}>
                  <BomTree
                    expandedIds={expandedIds}
                    query={query}
                    revealId={revealId}
                    selectedId={currentNode?.id ?? null}
                    visibleNodes={visibleNodes}
                    onSelect={(node) => { setSelectedNode(node); setIsDetailsOpen(true); setRevealId(null) }}
                    onToggle={toggleExpanded}
                  />
                  {currentNode && isDetailsOpen ? (
                    isPersisted && detailsQuery.isPending ? <aside className="bom-details bom-details--empty" role="status">Loading saved node details…</aside>
                      : isPersisted && (detailsQuery.error || !detailsQuery.data) ? <aside className="bom-details bom-details--empty" role="alert">Could not load saved node details. <button type="button" onClick={() => void detailsQuery.refetch()}>Retry</button></aside>
                        : <BomDetails byCode={view.byCode} node={detailNode} nodesById={nodesById} persisted={isPersisted} onClose={() => setIsDetailsOpen(false)} onNavigate={revealNode} />
                  ) : null}
                </div>
              </>
            ) : <RolledUpParts parts={view.rolledUpParts} persisted={isPersisted} />}
          </>
        ) : null}
        {activePreview && !isPersisted ? <div className="bom-local-only">Structure preview only · nodes not saved</div> : null}
      </div>
    </>
  )
}
