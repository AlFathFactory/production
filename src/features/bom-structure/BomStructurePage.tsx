import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'

import { PageHeader } from '../../components/shared/PageHeader'
import { Select } from '../../components/ui/Select'
import { isDesktopRuntime } from '../../config/platform'
import { useAuth } from '../auth/hooks/useAuth'
import { canManageBomImports } from '../auth/permissions'
import { getAncestorIds, getExpandableNodeIds, getSubtreeByNodeId, getVisibleBomNodes } from './bomTree'
import { buildBomPipelineStages } from './bomPipeline'
import { getBomRecoveryAdvice } from './bomRecovery'
import { BomDetails } from './components/BomDetails'
import { BomFocusControls } from './components/BomFocusControls'
import { BomExtractionPreview } from './components/BomExtractionPreview'
import { BomFilePicker } from './components/BomFilePicker'
import { BomImportSelector } from './components/BomImportSelector'
import { BomImportPreparation } from './components/BomImportPreparation'
import { BomPipelineProgress } from './components/BomPipelineProgress'
import { BomSaveReview } from './components/BomSaveReview'
import { BomSummary } from './components/BomSummary'
import { BomToolbar, type BomToolbarFilters } from './components/BomToolbar'
import { BomTree } from './components/BomTree'
import { BomWarnings } from './components/BomWarnings'
import { BomVersionHistory } from './components/BomVersionHistory'
import { useBomImportPreparation } from './hooks/useBomImportPreparation'
import { useBomNodeSave } from './hooks/useBomNodeSave'
import { useBomUnsavedGuard } from './hooks/useBomUnsavedGuard'
import { useBomWorkbook } from './hooks/useBomWorkbook'
import { useBomImports } from './queries/useBomImports'
import { bomRepository } from './repositories/bomRepository'
import { canReimportCurrentBom, canReplaceCurrentBom, downloadBomReplacementSource } from './bomReplaceGuard'
import { BOM_PARSER_VERSION, sha256BomSourceFile } from './bomSourceFile'
import { readBomWorkspaceUrl, writeBomWorkspaceUrl, type BomWorkspaceTab, type BomWorkspaceUrlState } from './bomUrlState'
import {
  useBomCurrentVersion,
  useBomExtractionPreview,
  useBomImport,
  useBomNodeDetails,
  useBomSummary,
  useBomTree,
  useBomWarnings,
  useBomVersions,
} from './queries/usePersistedBom'
import type { BomItemType, BomNode, BomParseResult } from './types'
import './BomStructurePage.css'

const ALL_ITEM_TYPES = new Set<BomItemType>(['assembly', 'part', 'material'])
const ALL_SOURCE_TYPES = new Set(['Eigenfertigung', 'Fremdbezug'])

function defaultTreeFilters(): BomToolbarFilters {
  return {
    itemTypes: new Set(ALL_ITEM_TYPES),
    leafOnly: false,
    level: null,
    reusedOnly: false,
    sourceTypes: new Set(ALL_SOURCE_TYPES),
    unmappedDimensionsOnly: false,
    warningsOnly: false,
  }
}

function toToolbarFilters(state: BomWorkspaceUrlState['filters']): BomToolbarFilters {
  return { ...state, itemTypes: new Set(state.itemTypes), sourceTypes: new Set(state.sourceTypes) }
}

function toUrlFilters(filters: BomToolbarFilters): BomWorkspaceUrlState['filters'] {
  return { ...filters, itemTypes: new Set(filters.itemTypes), sourceTypes: new Set(filters.sourceTypes) }
}

type WorkspaceData = Pick<BomParseResult, 'byCode' | 'headerRow' | 'nodes' | 'roots' | 'sheetName' | 'summary' | 'warnings'>
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
  const urlState = readBomWorkspaceUrl(searchParams)
  const selectedImportId = urlState.importId
  const [activeView, setActiveView] = useState<BomWorkspaceTab>(urlState.tab)
  const [reimportSourceId, setReimportSourceId] = useState<string | null>(null)
  const [replaceImportId, setReplaceImportId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [importSearch, setImportSearch] = useState('')
  const [query, setQuery] = useState(urlState.query)
  const [filters, setFilters] = useState<BomToolbarFilters>(() => toToolbarFilters(urlState.filters))
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(urlState.focusedNodeId)
  const [revealId, setRevealId] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<BomNode | null>(null)
  const updateWorkspaceUrl = useCallback((update: Partial<Omit<BomWorkspaceUrlState, 'filters'>> & { filters?: BomWorkspaceUrlState['filters'] }) => {
    setSearchParams((current) => {
      const state = readBomWorkspaceUrl(current)
      return writeBomWorkspaceUrl(current, { ...state, ...update, filters: update.filters ?? state.filters })
    }, { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    setActiveView(urlState.tab)
    setQuery(urlState.query)
    setFilters(toToolbarFilters(urlState.filters))
    setFocusedNodeId(urlState.focusedNodeId)
    if (!urlState.nodeId) {
      setSelectedNode(null)
      setIsDetailsOpen(false)
    }
  // URL changes include browser back/forward as well as direct deep links.
  }, [searchParams.toString()])
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
  const activePreview = (replaceImportId === selectedImportId || !isPersisted) && workbook.result
    && (replaceImportId === selectedImportId || !selectedImportId || selectedImportId === preparation.attempt?.importItem.id)
    ? workbook.result : null

  const persistedWorkspace = useMemo<WorkspaceData | null>(() => {
    if (!isPersisted || !treeQuery.data || !summaryQuery.data || !warningsQuery.data) return null
    const nodes = treeQuery.data.nodes
    const byCode = new Map<string, BomNode[]>()
    for (const node of nodes) {
      const occurrences = byCode.get(node.code)
      if (occurrences) occurrences.push(node)
      else byCode.set(node.code, [node])
    }
    return {
      byCode,
      headerRow: selectedImport?.headerRow ?? 0,
      nodes,
      roots: treeQuery.data.roots,
      sheetName: selectedImport?.sheetName ?? selectedImport?.fileName ?? 'Saved BOM',
      summary: summaryQuery.data,
      warnings: warningsQuery.data,
    }
  }, [isPersisted, selectedImport, summaryQuery.data, treeQuery.data, warningsQuery.data])
  const workspace: WorkspaceView | null = isPersisted && replaceImportId !== selectedImportId
    ? persistedWorkspace ? { source: 'persisted', data: persistedWorkspace } : null
    : activePreview ? { source: 'local-preview', data: activePreview } : null
  const view = workspace?.data ?? null
  const isBackendView = workspace?.source === 'persisted'
  const nodesById = useMemo(() => new Map(view?.nodes.map((node) => [node.id, node]) ?? []), [view])
  const currentNode = selectedNode ? nodesById.get(selectedNode.id) ?? null : null
  const focusedRoots = useMemo(() => view && focusedNodeId
    ? getSubtreeByNodeId(view.roots, focusedNodeId)
    : null, [focusedNodeId, view])
  const focusedNode = focusedRoots?.[0] ?? null
  const detailsQuery = useBomNodeDetails(currentNode?.id ?? null, Boolean(isPersisted && replaceImportId !== selectedImportId && isDetailsOpen))
  const detailNode = isBackendView && currentNode && detailsQuery.data
    ? { ...currentNode, ...detailsQuery.data, children: currentNode.children, isLeaf: currentNode.isLeaf, reuseCount: currentNode.reuseCount }
    : currentNode
  const sourceRowsWithWarnings = useMemo(() => new Set(view?.warnings.map((warning) => warning.sourceRow).filter((row) => row > 0) ?? []), [view])
  const unmappedDimensionCodes = useMemo(() => new Set((extractionQuery.data ?? [])
    .filter((candidate) => /dimension|mapping/i.test(JSON.stringify(candidate.blockers)))
    .map((candidate) => candidate.article)
    .filter((code): code is string => Boolean(code))), [extractionQuery.data])
  const visibleNodes = useMemo(() => view
    ? getVisibleBomNodes(focusedRoots ?? view.roots, expandedIds, {
        ...filters,
        query,
        sourceRowsWithWarnings,
        unmappedDimensionCodes,
      })
    : [], [expandedIds, filters, focusedRoots, query, sourceRowsWithWarnings, unmappedDimensionCodes, view])

  useEffect(() => {
    if (!view) return
    setExpandedIds(new Set(view.nodes.filter((node) => node.children.length).map((node) => node.id)))
    setRevealId(null)
  }, [view])

  useEffect(() => {
    if (!view || !focusedNodeId) return
    if (!focusedNode) {
      setFocusedNodeId(null)
      updateWorkspaceUrl({ focusedNodeId: null })
      return
    }
    setExpandedIds(getExpandableNodeIds([focusedNode]))
    setRevealId(focusedNode.id)
  }, [focusedNode, focusedNodeId, updateWorkspaceUrl, view])

  useEffect(() => {
    if (!view) return
    const deepLinkedNode = (urlState.nodeId || urlState.focusedNodeId) ? nodesById.get(urlState.nodeId || urlState.focusedNodeId!) ?? null : null
    setSelectedNode(deepLinkedNode)
    setIsDetailsOpen(Boolean(deepLinkedNode))
    if (deepLinkedNode) setExpandedIds((current) => new Set([...current, ...getAncestorIds(deepLinkedNode, nodesById)]))
  }, [nodesById, urlState.nodeId, view])

  useEffect(() => {
    if (view && activeView === 'extraction' && !(isBackendView && isCurrentSaved)) {
      setActiveView('structure')
      updateWorkspaceUrl({ tab: 'structure' })
    }
  }, [activeView, isBackendView, isCurrentSaved, updateWorkspaceUrl, view])

  const selectImport = (importId: string | null) => {
    updateWorkspaceUrl({ focusedNodeId: null, importId, nodeId: null })
  }

  const toggleExpanded = useCallback((node: BomNode) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(node.id)) next.delete(node.id)
      else next.add(node.id)
      return next
    })
  }, [])

  const handleSelectNode = useCallback((node: BomNode) => {
    setSelectedNode(node)
    setIsDetailsOpen(true)
    setRevealId(null)
    updateWorkspaceUrl({ nodeId: node.id })
  }, [updateWorkspaceUrl])

  const revealNode = useCallback((node: BomNode) => {
    setActiveView('structure')
    setExpandedIds((current) => new Set([...current, ...getAncestorIds(node, nodesById)]))
    setSelectedNode(node)
    setIsDetailsOpen(true)
    setRevealId(node.id)
    updateWorkspaceUrl({ nodeId: node.id, tab: 'structure' })
  }, [nodesById, updateWorkspaceUrl])

  const focusNode = useCallback((node: BomNode) => {
    setFocusedNodeId(node.id)
    setExpandedIds(getExpandableNodeIds([node]))
    setRevealId(node.id)
    updateWorkspaceUrl({ focusedNodeId: node.id, nodeId: node.id, tab: 'structure' })
  }, [updateWorkspaceUrl])

  const showFullStructure = useCallback(() => {
    setFocusedNodeId(null)
    setRevealId(null)
    updateWorkspaceUrl({ focusedNodeId: null })
  }, [updateWorkspaceUrl])

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

  const persistedError = [treeQuery, summaryQuery, warningsQuery]
    .map((state) => state.error).find(Boolean)
  const missingPersistedData = isPersisted && [treeQuery, summaryQuery, warningsQuery]
    .every((state) => state.isSuccess) && !persistedWorkspace
  const loadingPersisted = isPersisted && !persistedWorkspace && !persistedError && !missingPersistedData

  const saveErrorMessage = saving.saveMutation.error instanceof Error ? saving.saveMutation.error.message : null
  const replaceErrorMessage = saving.replaceMutation.error instanceof Error ? saving.replaceMutation.error.message : null
  const pipelineStages = useMemo(() => buildBomPipelineStages({
    hasParsed: Boolean(activePreview),
    hasSaved: saving.saveMutation.isSuccess || saving.replaceMutation.isSuccess,
    hasValidation: Boolean(saving.validation && saving.validatedImportId),
    isParsing: workbook.isParsing,
    isPersisted: Boolean(isPersisted && persistedWorkspace),
    isRefreshing: treeQuery.isFetching || summaryQuery.isFetching || warningsQuery.isFetching,
    isSaving: saving.saveMutation.isPending || saving.replaceMutation.isPending,
    isValidating: saving.validateMutation.isPending,
    parseError: workbook.error,
    preparationComplete: preparation.isComplete,
    preparationError: preparation.error,
    preparationStage: preparation.stage,
    saveError: saveErrorMessage ?? replaceErrorMessage,
    sourceUploaded: preparation.attempt?.uploaded ?? false,
    validationError: saving.validateMutation.error instanceof Error ? saving.validateMutation.error.message : null,
  }), [activePreview, isPersisted, persistedWorkspace, preparation.attempt, preparation.error, preparation.isComplete, preparation.stage, replaceErrorMessage, saveErrorMessage, saving.replaceMutation.isPending, saving.replaceMutation.isSuccess, saving.saveMutation.isPending, saving.saveMutation.isSuccess, saving.validatedImportId, saving.validateMutation.error, saving.validateMutation.isPending, saving.validation, summaryQuery.isFetching, treeQuery.isFetching, warningsQuery.isFetching, workbook.error, workbook.isParsing])
  const showPipeline = workbook.isParsing || Boolean(workbook.error) || Boolean(activePreview)
    || preparation.stage !== 'idle' || saving.validateMutation.isPending || Boolean(saving.validation)
    || saving.saveMutation.isPending || saving.replaceMutation.isPending
    || saving.saveMutation.isSuccess || saving.replaceMutation.isSuccess
  const recoveryAdvice = getBomRecoveryAdvice({
    extractionError: null,
    hasAttempt: Boolean(preparation.attempt),
    preparationError: preparation.error,
    preparationStage: preparation.stage,
    replaceError: replaceErrorMessage,
    saveError: saveErrorMessage,
    sourceUploaded: preparation.attempt?.uploaded ?? false,
  })
  const hasUnsavedBomWork = Boolean(activePreview && replaceImportId !== selectedImportId)
    || Boolean(preparation.attempt && !preparation.isComplete)
    || reimportSourceId !== null
    || replaceImportId !== null
    || Boolean(saving.validation && !saving.saveMutation.isSuccess && !saving.replaceMutation.isSuccess)
  useBomUnsavedGuard(hasUnsavedBomWork)
  const hasTreeCriteria = query.trim().length > 0 || filters.level !== null || filters.leafOnly || filters.reusedOnly
    || filters.warningsOnly || filters.unmappedDimensionsOnly || filters.itemTypes.size !== ALL_ITEM_TYPES.size || filters.sourceTypes.size !== ALL_SOURCE_TYPES.size
  const treeMatchCount = hasTreeCriteria ? visibleNodes.filter((entry) => entry.isMatch).length : 0

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
          {(selectedImport.sourceFilePath && selectedImport.sourceFileName && selectedImport.sourceFileBucket === 'bom-imports') || (canManageImports && isCurrentSaved) || isAdmin ? (
            <div className="bom-import-actions">
              <Select aria-label="Import actions" defaultValue="" disabled={actionBusy} onChange={(event) => {
                const action = event.currentTarget.value
                event.currentTarget.value = ''
                if (action === 'download') void downloadOriginal()
                else if (action === 'replace' && canStartReplace && !saving.isBusy) void startReplace()
                else if (action === 'reimport' && canStartReimport && !saving.isBusy) {
                  setReimportSourceId(selectedImport.id)
                  setReplaceImportId(null)
                  setActionError(null)
                } else if (action === 'delete' && isAdmin && !saving.isBusy) setShowDelete(true)
              }}>
                <option value="">Choose import action…</option>
                {selectedImport.sourceFilePath && selectedImport.sourceFileName && selectedImport.sourceFileBucket === 'bom-imports' ? <option value="download">Download Original Workbook</option> : null}
                {canManageImports && isCurrentSaved ? <>
                  <option disabled={!canStartReplace || saving.isBusy} value="replace">Replace Current Import</option>
                  <option disabled={!canStartReimport || saving.isBusy} value="reimport">Re-Import (choose a new workbook below)</option>
                </> : null}
                {isAdmin ? <option disabled={saving.isBusy} value="delete">Delete Import…</option> : null}
              </Select>
            </div>
          ) : null}
          {canManageImports && isCurrentSaved && !canReplaceWithCurrentParser ? <p role="alert">This BOM was created with parser version {selectedImport.parserVersion ?? 'unknown'}, while the current application uses {BOM_PARSER_VERSION}. In-place replacement is blocked to preserve import reproducibility. Use Re-Import to create a new version with the current parser.</p> : null}
          {reimportSourceId === selectedImport.id ? <p>Choose a workbook above to create v{selectedImport.versionNumber + 1}. The saved v{selectedImport.versionNumber} remains current until the candidate is saved. <button type="button" onClick={() => setReimportSourceId(null)}>Cancel</button></p> : null}
          {replaceImportId === selectedImport.id ? <p>Replacing nodes from this import’s verified original workbook. <button type="button" onClick={() => { setReplaceImportId(null); saving.reset() }}>Cancel replacement</button></p> : null}
          {showDelete && isAdmin ? <div role="group" aria-label="Delete BOM import confirmation" onKeyDown={(event) => { if (event.key === 'Escape') { setShowDelete(false); setDeleteConfirmation('') } }}><p>Delete import v{selectedImport.versionNumber} ({selectedImport.fileName}) and its nodes/warnings? This cannot be undone. Type DELETE to confirm.</p><input autoFocus aria-label="Type DELETE to confirm" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /><button disabled={deleteConfirmation !== 'DELETE' || actionBusy} type="button" onClick={() => void deleteImport()}>Delete this import</button></div> : null}
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
          onSaved={() => { setReplaceImportId(null) }}
        /> : null}
        {selectedImport?.status === 'parsed' && !activePreview ? (
          <div className="bom-state-message">This import has an attached source, but its structure is not saved. Reopen the original workbook to continue preparing it.</div>
        ) : null}
        {selectedImport?.status === 'failed' ? <div className="bom-state-message">This import failed and has no saved structure to display.</div> : null}
        {showPipeline ? <BomPipelineProgress stages={pipelineStages} /> : null}
        {recoveryAdvice ? <p className="bom-recovery-notice" data-tone={recoveryAdvice.tone} role="alert">{recoveryAdvice.message}</p> : null}
        {loadingPersisted ? <div className="bom-state-message" role="status">Loading saved tree, summary, and warnings…</div> : null}
        {persistedError ? <div className="bom-state-message" role="alert">Could not load the saved BOM. <button type="button" onClick={() => {
          void treeQuery.refetch(); void summaryQuery.refetch(); void warningsQuery.refetch()
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
              <span role="status">{hasTreeCriteria ? `${treeMatchCount.toLocaleString('en-US')} matches · ` : ''}{visibleNodes.length.toLocaleString('en-US')} of {view.nodes.length.toLocaleString('en-US')} rows visible</span>
            </div>
            <BomSummary summary={view.summary} />
            <BomWarnings key={`${isBackendView ? 'saved' : 'preview'}:${selectedImportId ?? 'unsaved'}`} persisted={isBackendView} warnings={view.warnings} />
            <div className="bom-view-tabs" role="tablist" aria-label="BOM views">
              <button aria-selected={activeView === 'structure'} role="tab" type="button" onClick={() => { setActiveView('structure'); updateWorkspaceUrl({ tab: 'structure' }) }}>Structure Explorer</button>
              {isBackendView && isCurrentSaved ? <button aria-selected={activeView === 'extraction'} role="tab" type="button" onClick={() => { setActiveView('extraction'); updateWorkspaceUrl({ tab: 'extraction' }) }}>Extraction Preview</button> : null}
            </div>
            {activeView === 'structure' ? (
              <>
                <BomToolbar
                  filters={filters}
                  maxLevel={view.summary.levels}
                  onClearFilters={() => {
                    const next = defaultTreeFilters()
                    setFilters(next)
                    updateWorkspaceUrl({ filters: toUrlFilters(next) })
                  }}
                  query={query}
                  onCollapseAll={() => setExpandedIds(new Set())}
                  onExpandAll={expandAll}
                  onFiltersChange={(next) => {
                    setFilters(next)
                    updateWorkspaceUrl({ filters: toUrlFilters(next) })
                  }}
                  onQueryChange={(next) => {
                    setQuery(next)
                    updateWorkspaceUrl({ query: next })
                  }}
                />
                <BomFocusControls
                  focusedNode={focusedNode}
                  selectedNode={currentNode}
                  onFocus={focusNode}
                  onShowFullStructure={showFullStructure}
                />
                <div className={`bom-explorer${currentNode && isDetailsOpen ? ' bom-explorer--details-open' : ''}`}>
                  <BomTree
                    expandedIds={expandedIds}
                    levelOffset={focusedNode ? focusedNode.level - 1 : 0}
                    query={query}
                    revealId={revealId}
                    selectedId={currentNode?.id ?? null}
                    visibleNodes={visibleNodes}
                    onSelect={handleSelectNode}
                    onToggle={toggleExpanded}
                  />
                  {currentNode && isDetailsOpen ? (
                    isBackendView && detailsQuery.isPending ? <aside className="bom-details bom-details--empty" role="status">Loading saved node details…</aside>
                      : isBackendView && (detailsQuery.error || !detailsQuery.data) ? <aside className="bom-details bom-details--empty" role="alert">Could not load saved node details. <button type="button" onClick={() => void detailsQuery.refetch()}>Retry</button></aside>
                        : <BomDetails byCode={view.byCode} node={detailNode} nodesById={nodesById} canManageMappings={canManageImports && (!isBackendView || Boolean(isCurrentSaved))} persisted={isBackendView} onClose={() => { const rowId = currentNode.id; setIsDetailsOpen(false); setSelectedNode(null); updateWorkspaceUrl({ nodeId: null }); window.requestAnimationFrame(() => document.getElementById(`bom-tree-${rowId}`)?.focus()) }} onNavigate={revealNode} />
                  ) : null}
                </div>
              </>
            ) : isBackendView && isCurrentSaved ? extractionQuery.isPending ? <p role="status">Loading extraction preview…</p>
                : extractionQuery.error ? <p role="alert">Could not load extraction preview. <button type="button" onClick={() => void extractionQuery.refetch()}>Retry</button></p>
                  : <BomExtractionPreview key={selectedImportId} candidates={extractionQuery.data ?? []} canExecute={canManageImports} canManageDesignationMappings={canManageImports} canUpdateDesignationMappings={isAdmin} importId={selectedImportId!} lotId={selectedImport?.lotId ?? null} versionNumber={selectedImport?.versionNumber ?? 0} /> : null}
          </>
        ) : null}
        {activePreview && !isPersisted ? <div className="bom-local-only">Structure preview only · nodes not saved</div> : null}
      </div>
    </>
  )
}
