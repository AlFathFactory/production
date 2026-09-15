import { supabase } from '../../services/supabase/client'
import { mapProductionImportRequestError, parseProductionImportResponse } from './import/productionImportResponse'
import type { ImportProductionFileInput, ProductionImportResult } from './import/types'
import type {
  AddProductionStageEntryInput,
  CreateProductionItemInput,
  ProductionFilters,
  ProductionSearchRow,
} from './types'

export class ProductionRepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductionRepositoryError'
  }
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''
}

function getErrorMessage(error: unknown): string {
  return typeof error === 'object' && error !== null && 'message' in error
    ? String(error.message)
    : error instanceof Error
      ? error.message
      : ''
}

function mapProductionError(error: unknown, action: 'load' | 'create' | 'stage'): ProductionRepositoryError {
  const errorCode = getErrorCode(error)
  const errorMessage = getErrorMessage(error)

  if (errorCode === '42501') {
    return new ProductionRepositoryError(
      action === 'create'
        ? 'You do not have permission to add materials.'
        : action === 'stage'
          ? 'You do not have permission to add Production progress.'
          : 'You do not have permission to view Production data.',
    )
  }

  if (errorCode === '23505' && action === 'create') {
    return new ProductionRepositoryError('This article already exists in the selected lot.')
  }

  if (action === 'stage' && /CUT quantity would exceed/i.test(errorMessage)) {
    return new ProductionRepositoryError('The available quantity changed. Production data has been refreshed. CUT quantity exceeds the remaining required quantity.')
  }

  if (action === 'stage' && /DISPENSE quantity would exceed/i.test(errorMessage)) {
    return new ProductionRepositoryError('The available quantity changed. Production data has been refreshed. Dispense quantity exceeds current warehouse stock.')
  }

  if (action === 'stage' && /ROLLING stage is only allowed/i.test(errorMessage)) {
    return new ProductionRepositoryError('Rolling is not available for this material route.')
  }

  if (action === 'stage' && /Production item not found|Active application user profile required|Quantity must be greater than zero/i.test(errorMessage)) {
    return new ProductionRepositoryError('Production data changed or the entry is no longer valid. Production data has been refreshed. Please review and try again.')
  }

  if (error instanceof TypeError || (error instanceof Error && /fetch|network|connection|offline/i.test(error.message))) {
    return new ProductionRepositoryError('Unable to reach Production Control. Check your connection and try again.')
  }

  return new ProductionRepositoryError(
    action === 'create'
      ? 'The material could not be added. Please try again.'
      : action === 'stage'
        ? 'Production progress could not be added. Please try again.'
        : 'Production data could not be loaded. Please try again.',
  )
}

export const productionRepository = {
  async searchProductionItems(filters: ProductionFilters): Promise<ProductionSearchRow[]> {
    const { data, error } = await supabase.rpc('search_production_items', {
      p_lot_id: filters.lotId ?? undefined,
      p_next_action: filters.nextAction ?? undefined,
      p_progress_state: filters.progressState ?? undefined,
      p_project_id: filters.projectId ?? undefined,
      p_project_number_id: filters.projectNumberId ?? undefined,
      p_query: filters.query.trim() || undefined,
      p_route: filters.route ?? undefined,
    })

    if (error) {
      throw mapProductionError(error, 'load')
    }

    return data
  },

  async createProductionItem(input: CreateProductionItemInput): Promise<{ id: string }> {
    const { data, error } = await supabase
      .from('production_items')
      .insert({
        article: input.article.trim(),
        created_by: input.createdBy,
        designation: input.designation.trim() || null,
        lot_id: input.lotId,
        material: input.material.trim() || null,
        profile: input.profile.trim() || null,
        remark: input.remark.trim() || null,
        routing: input.routing,
        source: 'manual',
        total_quantity: input.totalQuantity,
        unit_weight_kg: input.unitWeightKg,
      })
      .select('id')
      .single()

    if (error) {
      throw mapProductionError(error, 'create')
    }

    return data
  },

  async addProductionStageEntry(input: AddProductionStageEntryInput): Promise<void> {
    const { error } = await supabase.rpc('add_production_stage_entry', {
      p_entry_date: input.entryDate,
      p_note: input.note.trim() || undefined,
      p_production_item_id: input.productionItemId,
      p_quantity: input.quantity,
      p_source: 'manual',
      p_source_reference: undefined,
      p_stage: input.stage,
    })

    if (error) {
      throw mapProductionError(error, 'stage')
    }
  },

  async importProductionPreparationFile(input: ImportProductionFileInput): Promise<ProductionImportResult> {
    const { data, error } = await supabase.rpc('import_production_preparation_file', {
      p_file_name: input.fileName,
      p_lot_id: input.lotId,
      p_rows: input.rows,
    })

    if (error) {
      throw mapProductionImportRequestError(error)
    }

    return parseProductionImportResponse(data)
  },
}
