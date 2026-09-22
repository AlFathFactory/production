import { useState } from 'react'
import type { ReactNode } from 'react'

import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { canCreateProductionItems, canImportProduction } from '../auth/permissions'
import { useAuth } from '../auth/hooks/useAuth'
import { AddMaterialDialog } from './components/AddMaterialDialog'
import { ProductionFilters } from './components/ProductionFilters'
import { ProjectLotSelector } from './components/ProjectLotSelector'
import { StageEntryDialog } from './components/StageEntryDialog'
import { ProductionSummary } from './components/ProductionSummary'
import { ProductionTable } from './components/ProductionTable'
import { ProductionHistoryDialog } from './history/components/ProductionHistoryDialog'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { useProductionFilters } from './hooks/useProductionFilters'
import { ProductionImportDialog } from './import/components/ProductionImportDialog'
import type { ProductionImportPayloadRow, ProductionImportResult } from './import/types'
import { useAddProductionStageEntry } from './mutations/useAddProductionStageEntry'
import { useCreateProductionItem } from './mutations/useCreateProductionItem'
import { useImportProductionFile } from './mutations/useImportProductionFile'
import { useProductionItems } from './queries/productionQueries'
import type { CreateProductionItemInput, DirectStageAction, ProductionSearchRow } from './types'

function ProductionState({ children }: { children: ReactNode }) {
  return <section className="production-state">{children}</section>
}

export function ProductionPage() {
  const { session, userProfile } = useAuth()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectNumberId, setProjectNumberId] = useState<string | null>(null)
  const [lotId, setLotId] = useState<string | null>(null)
  const [selectionLabels, setSelectionLabels] = useState({ project: '', projectNumber: '', lot: '' })
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [stageSelection, setStageSelection] = useState<{ action: DirectStageAction; item: ProductionSearchRow } | null>(null)
  const [historySelection, setHistorySelection] = useState<ProductionSearchRow | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const productionFilters = useProductionFilters()
  const debouncedQuery = useDebouncedValue(productionFilters.filters.query)
  const searchFilters = {
    projectId,
    projectNumberId,
    lotId,
    ...productionFilters.filters,
    query: debouncedQuery,
  }
  const itemsQuery = useProductionItems(searchFilters)
  const createMaterialMutation = useCreateProductionItem(searchFilters)
  const addStageMutation = useAddProductionStageEntry(searchFilters)
  const importMutation = useImportProductionFile(searchFilters)
  const canAddMaterial = Boolean(userProfile && canCreateProductionItems(userProfile.role))
  const canImport = Boolean(userProfile && canImportProduction(userProfile.role))

  const selectProject = (nextProjectId: string | null, label: string | null) => {
    setProjectId(nextProjectId)
    setProjectNumberId(null)
    setLotId(null)
    setSelectionLabels({ project: label ?? '', projectNumber: '', lot: '' })
  }

  const addMaterial = async (values: Omit<CreateProductionItemInput, 'createdBy' | 'lotId'>) => {
    if (!lotId || !session?.user.id) {
      throw new Error('Select a lot before adding a material.')
    }

    await createMaterialMutation.mutateAsync({ ...values, lotId, createdBy: session.user.id })
    setSuccessMessage('Material added successfully.')
  }

  const addStageEntry = async ({ entryDate, note, quantity }: { entryDate: string; note: string; quantity: number }) => {
    if (!stageSelection?.item.production_item_id) {
      throw new Error('The selected Production item is no longer available.')
    }

    await addStageMutation.mutateAsync({
      entryDate,
      note,
      productionItemId: stageSelection.item.production_item_id,
      quantity,
      stage: stageSelection.action.stage,
    })
    setSuccessMessage(`${stageSelection.action.stage} progress added successfully.`)
  }

  const selectProjectNumber = (nextProjectNumberId: string | null, label: string | null) => {
    setProjectNumberId(nextProjectNumberId)
    setLotId(null)
    setSelectionLabels((current) => ({ ...current, projectNumber: label ?? '', lot: '' }))
  }

  const selectLot = (nextLotId: string | null, label: string | null) => {
    setLotId(nextLotId)
    setSelectionLabels((current) => ({ ...current, lot: label ?? '' }))
  }

  const importWorkbook = async (fileName: string, rows: ProductionImportPayloadRow[]): Promise<ProductionImportResult> => {
    if (!lotId) {
      throw new Error('Select a lot before importing a workbook.')
    }

    const result = await importMutation.mutateAsync({ fileName, lotId, rows })
    setSuccessMessage('Production workbook imported successfully.')
    return result
  }

  const importDestination = [selectionLabels.project, selectionLabels.projectNumber, selectionLabels.lot]
    .filter(Boolean)
    .join(' → ')

  return (
    <>
      <PageHeader
        title="Production"
        description="View calculated production status for items in a selected lot."
        actions={canAddMaterial || canImport ? (
          <>
            {canImport ? (
              <Button type="button" variant="secondary" disabled={!lotId} title={lotId ? undefined : 'Select a lot to import Production.'} onClick={() => setIsImportOpen(true)}>
                Import Excel
              </Button>
            ) : null}
            {canAddMaterial ? (
              <Button type="button" disabled={!lotId} title={lotId ? undefined : 'Select a lot to add material.'} onClick={() => setIsAddMaterialOpen(true)}>
                Add Material
              </Button>
            ) : null}
          </>
        ) : undefined}
      />
      <div className="production-workspace">
        {successMessage ? <p className="production-feedback" role="status">{successMessage}</p> : null}
        <ProjectLotSelector
          projectId={projectId}
          projectNumberId={projectNumberId}
          lotId={lotId}
          onProjectChange={selectProject}
          onProjectNumberChange={selectProjectNumber}
          onLotChange={selectLot}
        />
        <ProductionFilters
          filters={productionFilters.filters}
          hasActiveFilters={productionFilters.hasActiveFilters}
          onQueryChange={productionFilters.setQuery}
          onRouteChange={productionFilters.setRoute}
          onNextActionChange={productionFilters.setNextAction}
          onProgressStateChange={productionFilters.setProgressState}
          onReset={productionFilters.resetFilters}
        />
        {!projectId ? <ProductionState>Select a project to begin.</ProductionState> : null}
        {projectId && !projectNumberId ? <ProductionState>Select a project number.</ProductionState> : null}
        {projectNumberId && !lotId ? <ProductionState>Select a lot to view Production.</ProductionState> : null}
        {lotId && itemsQuery.isPending ? <ProductionState><LoadingSpinner label="Loading production data" /> Loading production data…</ProductionState> : null}
        {lotId && itemsQuery.isError ? (
          <ProductionState>
            <p>Production data could not be loaded. Please try again.</p>
            <Button type="button" variant="secondary" onClick={() => void itemsQuery.refetch()}>Retry</Button>
          </ProductionState>
        ) : null}
        {lotId && itemsQuery.data?.length === 0 ? (
          <ProductionState>
            <p>{productionFilters.hasActiveFilters ? 'No Production items match the current filters.' : 'No Production items are available for this lot.'}</p>
            {productionFilters.hasActiveFilters ? <Button type="button" variant="secondary" onClick={productionFilters.resetFilters}>Reset Filters</Button> : null}
          </ProductionState>
        ) : null}
        {itemsQuery.data && itemsQuery.data.length > 0 ? (
          <section className="production-results" aria-label="Production results">
            <ProductionSummary items={itemsQuery.data} />
            <ProductionTable
              key={lotId}
              filterKey={JSON.stringify(searchFilters)}
              items={itemsQuery.data}
              onStageAction={(item, action) => setStageSelection({ item, action })}
              onViewHistory={(item) => setHistorySelection(item)}
            />
          </section>
        ) : null}
      </div>
      {canAddMaterial ? <AddMaterialDialog isOpen={isAddMaterialOpen} onClose={() => setIsAddMaterialOpen(false)} onSubmit={addMaterial} /> : null}
      {canImport ? (
        <ProductionImportDialog
          destination={importDestination || 'Selected Lot'}
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImport={importWorkbook}
        />
      ) : null}
      <StageEntryDialog
        action={stageSelection?.action ?? null}
        isOpen={Boolean(stageSelection)}
        item={stageSelection?.item ?? null}
        onClose={() => setStageSelection(null)}
        onSubmit={addStageEntry}
      />
      <ProductionHistoryDialog
        isOpen={Boolean(historySelection)}
        onClose={() => setHistorySelection(null)}
        productionItemId={historySelection?.production_item_id ?? null}
        itemArticle={historySelection?.article ?? ''}
        itemDesignation={historySelection?.designation ?? null}
        userRole={userProfile?.role ?? null}
      />
    </>
  )
}
