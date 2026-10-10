import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'

import { PageHeader } from '../../components/shared/PageHeader'
import { isDesktopRuntime } from '../../config/platform'
import { useAuth } from '../auth/hooks/useAuth'
import { canManageBomImports } from '../auth/permissions'
import { getAncestorIds, getVisibleBomNodes } from './bomTree'
import { BomDetails } from './components/BomDetails'
import { BomExtractionPreview } from './components/BomExtractionPreview'
import { BomFilePicker } from './components/BomFilePicker'
import { BomImportSelector } from './components/BomImportSelector'
import { BomImportPreparation } from './components/BomImportPreparation'
import { BomSaveReview } from './components/BomSaveReview'
import { BomSummary } from './components/BomSummary'
import { BomToolbar } from './components/BomToolbar'
import { BomTree } from './components/BomTree'
import { BomWarnings } from './components/BomWarnings'
import { BomVersionHistory } from './components/BomVersionHistory'
import { RolledUpParts } from './components/RolledUpParts'
import { useBomImportPreparation } from './hooks/useBomImportPreparation'
import { useBomNodeSave } from './hooks/useBomNodeSave'
import { useBomWorkbook } from './hooks/useBomWorkbook'
import { useBomImports } from './queries/useBomImports'
import { bomRepository } from './repositories/bomRepository'
import { canReimportCurrentBom, canReplaceCurrentBom, downloadBomReplacementSource } from './bomReplaceGuard'
import { BOM_PARSER_VERSION, sha256BomSourceFile } from './bomSourceFile'
import {
  useBomCurrentVersion,
  useBomExtractionPreview,
  useBomImport,
  useBomNodeDetails,
  useBomRolledUpParts,
  useBomSummary,
  useBomTree,
  useBomWarnings,
  useBomVersions,
} from './queries/usePersistedBom'
import type { BomItemType, BomNode, BomParseResult } from './types'
import './BomStructurePage.css'

const ALL_ITEM_TYPES = new Set<BomItemType>(['assembly', 'part', 'material'])
const ALL_SOURCE_TYPES = new Set(['Eigenfertigung', 'Fremdbezug'])

type WorkspaceData = Pick<BomParseResult, 'byCode' | 'headerRow' | 'nodes' | 'rolledUpParts' | 'roots' | 'sheetName' | 'summary' | 'warnings'>
type WorkspaceView = { source: 'local-preview' | 'persisted'; data: WorkspaceData }

export function BomStructurePage() {
  const workbook = useBomWorkbook()
  const preparation = useBomImportPreparation()
  const saving = useBomNodeSave()
  const { userProfile } = useAuth()
  const queryClient = useQueryClient()
  const canManageImports = Boolean(userProfile?.is_active && canManageBomImports(userProfile.role))
  const isAdmin = Boolean(userProfile?.is_active && userProfile.role === 'admin')
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedImportId = searchParams.get('bomImportId') || null
  const [activeView, setActiveView] = useState<'structure' | 'rollup' | 'extraction'>('structure')
  const [reimportSourceId, setReimportSourceId] = useState<string | null>(null)
  const [replaceImportId, setReplaceImportId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [importSearch, setImportSearch] = useState('')
  const [query, setQuery] = useState('')
  const [revealId, setRevealId] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<BomNode | null>(null)
  const importsQuery = useBomImports({ search: importSearch })
  const importQuery = useBomImport(selectedImportId)
  const selectedImport = importQuery.data
  const versionsQuery = useBomVersions(selectedImport?.versionGroupId ?? null)
  const currentVersionQuery = useBomCurrentVersion(selectedImport?.versionGroupId ?? null)
  const currentSavedId = currentVersionQuery.data ?? null
  const isCurrentSaved = selectedImport?.status === 'saved' && selectedImport.id === currentSavedId
  const canReplaceWithCurrentParser = selectedImport?.parserVersion === BOM_PARSER_VERSION
  const canStartReplace = canReplaceCurrentBom(selectedImport, currentSavedId, canManageImports)
  const canStartReimport = canReimportCurrentBom(selectedImport, currentSavedId, canManageImports)
  const isPersisted = selectedImport?.status === 'saved' || selectedImport?.status === 'superseded'
  const extractionQuery = useBomExtractionPreview(selectedImportId, Boolean(isCurrentSaved))
  const treeQuery = useBomTree(selectedImportId, isPersisted)
  const summaryQuery = useBomSummary(selectedImportId, isPersisted)
  const warningsQuery = useBomWarnings(selectedImportId, isPersisted)
  const rollupsQuery = useBomRolledUpParts(selectedImportId, isPersisted)
  const activePreview = (replaceImportId === selectedImportId || !isPersisted) && workbook.result
    && (replaceImportId === selectedImportId || !selectedImportId || selectedImportId === preparation.attempt?.importItem.id)
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
  const workspace: WorkspaceView | null = isPersisted && replaceImportId !== selectedImportId
    ? persistedWorkspace ? { source: 'persisted', data: persistedWorkspace } : null
    : activePreview ? { source: 'local-preview', data: activePreview } : null
  const view = workspace?.data ?? null
  const isBackendView = workspace?.source === 'persisted'
  const nodesById = useMemo(() => new Map(view?.nodes.map((node) => [node.id, node]) ?? []), [view])
  const currentNode = selectedNode ? nodesById.get(selectedNode.id) ?? null : null
  const detailsQuery = useBomNodeDetails(currentNode?.id ?? null, Boolean(isPersisted && replaceImportId !== selectedImportId && isDetailsOpen))
  const detailNode = isBackendView && currentNode && detailsQuery.data
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
    setReplaceImportId(null)
    setActionError(null)
    selectImport(null)
    await workbook.selectFile(file)
  }

  const openImport = (id: string | null) => {
    if (preparation.isBusy || saving.isBusy) return
    preparation.reset()
    saving.reset()
    setReplaceImportId(null)
    setReimportSourceId(null)
    setShowDelete(false)
    setActionError(null)
    selectImport(id)
  }

  const startReplace = async () => {
    if (!selectedImport?.sourceFileName || !canReplaceCurrentBom(selectedImport, currentSavedId, canManageImports)) return
    setActionBusy(true)
    setActionError(null)
    try {
      const blob = await downloadBomReplacementSource(selectedImport, currentSavedId, canManageImports, bomRepository.downloadSourceFile)
      if (!blob) return
      const file = new File([blob], selectedImport.sourceFileName, { type: selectedImport.sourceFileMimeType ?? '' })
      if (selectedImport.sourceFileSha256 && await sha256BomSourceFile(file) !== selectedImport.sourceFileSha256) {
        throw new Error('Downloaded workbook checksum differs from the attached source. Replacement was cancelled.')
      }
      preparation.reset()
      saving.reset()
      setReplaceImportId(selectedImport.id)
      await workbook.selectFile(file)
    } catch (error) {
      setReplaceImportId(null)
      setActionError(error instanceof Error ? error.message : 'Could not load the original workbook.')
    } finally {
      setActionBusy(false)
    }
  }

  const downloadOriginal = async () => {
    if (!selectedImport?.sourceFilePath || !selectedImport.sourceFileName || selectedImport.sourceFileBucket !== 'bom-imports') return
    setActionBusy(true)
    setActionError(null)
    try {
      const blob = await bomRepository.downloadSourceFile(selectedImport.sourceFilePath)
      if (isDesktopRuntime()) {
        const { saveDesktopWorkbook } = await import('../../services/desktop/desktopFiles')
        await saveDesktopWorkbook(new Uint8Array(await blob.arrayBuffer()), selectedImport.sourceFileName)
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = selectedImport.sourceFileName
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not download the original workbook.')
    } finally {
      setActionBusy(false)
    }
  }

  const deleteImport = async () => {
    if (!selectedImport || !isAdmin || deleteConfirmation !== 'DELETE') return
    setActionBusy(true)
    setActionError(null)
    try {
      await bomRepository.deleteImport({ p_bom_import_id: selectedImport.id, p_confirmation: deleteConfirmation })
      await queryClient.invalidateQueries({ queryKey: ['bom'] })
      openImport(null)
      setDeleteConfirmation('')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not delete the BOM import.')
    } finally {
      setActionBusy(false)
    }
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
          onSelect={(importId) => openImport(importId || null)}
        />
        {selectedImport ? <>
          <BomVersionHistory currentId={currentSavedId} error={versionsQuery.error instanceof Error ? versionsQuery.error.message : null}
            imports={versionsQuery.data ?? []} isLoading={versionsQuery.isPending} onRetry={() => void versionsQuery.refetch()}
            onSelect={(id) => openImport(id)} selectedId={selectedImport.id} />
          {currentVersionQuery.isPending ? <p role="status">Resolving current saved version…</p> : currentVersionQuery.error ? <p role="alert">Could not resolve the current saved version. <button type="button" onClick={() => void currentVersionQuery.refetch()}>Retry</button></p>
            : <p role="status">{isCurrentSaved ? 'This is the current saved Production source.' : currentSavedId ? `Current saved Production source: v${versionsQuery.data?.find((item) => item.id === currentSavedId)?.versionNumber ?? '?'}.` : 'No current saved Production source exists for this version group.'} {selectedImport.status === 'parsed' ? 'This parsed candidate is not active.' : null}</p>}
          <div className="bom-import-actions">
            {selectedImport.sourceFilePath && selectedImport.sourceFileBucket === 'bom-imports' ? <button disabled={actionBusy} type="button" onClick={() => void downloadOriginal()}>Download Original Workbook</button> : null}
            {canManageImports && isCurrentSaved ? <>
              <button disabled={!canStartReplace || actionBusy || saving.isBusy} type="button" onClick={() => void startReplace()}>Replace Current Import</button>
              <button disabled={!canStartReimport || actionBusy || saving.isBusy} type="button" onClick={() => { setReimportSourceId(selectedImport.id); setReplaceImportId(null); setActionError(null) }}>Re-Import (choose a new workbook below)</button>
            </> : null}
            {isAdmin ? <button disabled={actionBusy || saving.isBusy} type="button" onClick={() => setShowDelete((value) => !value)}>Delete Import…</button> : null}
          </div>
          {canManageImports && isCurrentSaved && !canReplaceWithCurrentParser ? <p role="alert">This BOM was created with parser version {selectedImport.parserVersion ?? 'unknown'}, while the current application uses {BOM_PARSER_VERSION}. In-place replacement is blocked to preserve import reproducibility. Use Re-Import to create a new version with the current parser.</p> : null}
          {reimportSourceId === selectedImport.id ? <p>Choose a workbook above to create v{selectedImport.versionNumber + 1}. The saved v{selectedImport.versionNumber} remains current until the candidate is saved. <button type="button" onClick={() => setReimportSourceId(null)}>Cancel</button></p> : null}
          {replaceImportId === selectedImport.id ? <p>Replacing nodes from this import’s verified original workbook. <button type="button" onClick={() => { setReplaceImportId(null); saving.reset() }}>Cancel replacement</button></p> : null}
          {showDelete && isAdmin ? <div role="group" aria-label="Delete BOM import confirmation"><p>Delete import v{selectedImport.versionNumber} ({selectedImport.fileName}) and its nodes/warnings? This cannot be undone. Type DELETE to confirm.</p><input aria-label="Type DELETE to confirm" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /><button disabled={deleteConfirmation !== 'DELETE' || actionBusy} type="button" onClick={() => void deleteImport()}>Delete this import</button></div> : null}
          {actionError ? <p role="alert">{actionError}</p> : null}
        </> : null}
        {selectedImportId && importQuery.error ? <div className="bom-state-message" role="alert">Unable to load this import. <button type="button" onClick={() => void importQuery.refetch()}>Retry</button></div> : null}
        {selectedImportId && importQuery.isPending ? <div className="bom-state-message" role="status">Loading import…</div> : null}
        {selectedImportId && importQuery.isSuccess && !selectedImport ? <div className="bom-state-message" role="alert">This BOM import is not available.</div> : null}
        {canManageImports && activePreview && workbook.sourceFile && !(replaceImportId && replaceImportId === selectedImportId) ? (
          <BomImportPreparation
            file={workbook.sourceFile}
            previousImportId={reimportSourceId}
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
            onSaved={(importId) => { setReimportSourceId(null); selectImport(importId) }}
          />
        ) : null}
        {canStartReplace && selectedImport && replaceImportId === selectedImportId && activePreview ? <BomSaveReview
          importId={selectedImport.id} mode="replace" result={activePreview} saving={saving}
          onSaved={() => { setReplaceImportId(null); void queryClient.invalidateQueries({ queryKey: ['bom'] }) }}
        /> : null}
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
              <span><strong>{view.sheetName}</strong> · {isBackendView ? `saved import v${selectedImport?.versionNumber} · backend calculations` : `header detected at Excel row ${view.headerRow} · local preview calculations`}</span>
              <span>{visibleNodes.length.toLocaleString('en-US')} of {view.nodes.length.toLocaleString('en-US')} rows visible</span>
            </div>
            <BomSummary summary={view.summary} />
            <BomWarnings persisted={isBackendView} warnings={view.warnings} />
            <div className="bom-view-tabs" role="tablist" aria-label="BOM views">
              <button aria-selected={activeView === 'structure'} role="tab" type="button" onClick={() => setActiveView('structure')}>Structure Explorer</button>
              <button aria-selected={activeView === 'rollup'} role="tab" type="button" onClick={() => setActiveView('rollup')}>Rolled-up Parts <span>{view.rolledUpParts.length.toLocaleString('en-US')}</span></button>
              {isBackendView && isCurrentSaved ? <button aria-selected={activeView === 'extraction'} role="tab" type="button" onClick={() => setActiveView('extraction')}>Extraction Preview</button> : null}
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
                    isBackendView && detailsQuery.isPending ? <aside className="bom-details bom-details--empty" role="status">Loading saved node details…</aside>
                      : isBackendView && (detailsQuery.error || !detailsQuery.data) ? <aside className="bom-details bom-details--empty" role="alert">Could not load saved node details. <button type="button" onClick={() => void detailsQuery.refetch()}>Retry</button></aside>
                        : <BomDetails byCode={view.byCode} node={detailNode} nodesById={nodesById} canManageMappings={canManageImports && (!isBackendView || Boolean(isCurrentSaved))} persisted={isBackendView} onClose={() => setIsDetailsOpen(false)} onNavigate={revealNode} />
                  ) : null}
                </div>
              </>
            ) : activeView === 'rollup' ? <RolledUpParts parts={view.rolledUpParts} persisted={isBackendView} />
              : isBackendView && isCurrentSaved ? extractionQuery.isPending ? <p role="status">Loading extraction preview…</p>
                : extractionQuery.error ? <p role="alert">Could not load extraction preview. <button type="button" onClick={() => void extractionQuery.refetch()}>Retry</button></p>
                  : <BomExtractionPreview key={selectedImportId} candidates={extractionQuery.data ?? []} importId={selectedImportId!} /> : null}
          </>
        ) : null}
        {activePreview && !isPersisted ? <div className="bom-local-only">Structure preview only · nodes not saved</div> : null}
      </div>
    </>
  )
}
