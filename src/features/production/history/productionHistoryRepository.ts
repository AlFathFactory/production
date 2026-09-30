import { supabase } from '../../../services/supabase/client'
import type { Database } from '../../../types/database'
import type {
  CorrectProductionStageEntryInput,
  DeleteProductionStageEntryInput,
  ProductionHistoryFilters,
  ProductionStageEntry,
  ProductionStageEntryAudit,
  ProductionStageSource,
} from './types'

export class ProductionHistoryRepositoryError extends Error {
  constructor(
    public readonly kind: 'permission' | 'not_found' | 'validation' | 'network' | 'document_protected' | 'unknown',
    message: string,
  ) {
    super(message)
    this.name = 'ProductionHistoryRepositoryError'
  }
}

function mapError(error: unknown, action: 'history' | 'audit' | 'correct' | 'delete'): ProductionHistoryRepositoryError {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  const message = error instanceof Error ? error.message : ''

  if (code === '42501' || /permission denied/i.test(message)) {
    return new ProductionHistoryRepositoryError('permission', 'You do not have permission to perform this action.')
  }

  if (action === 'correct' && /reason is required/i.test(message)) {
    return new ProductionHistoryRepositoryError('validation', 'Correction reason is required.')
  }

  if (action === 'delete' && /reason is required/i.test(message)) {
    return new ProductionHistoryRepositoryError('validation', 'Deletion reason is required.')
  }

  if (action === 'correct' && /quantity must be greater than zero/i.test(message)) {
    return new ProductionHistoryRepositoryError('validation', 'Quantity must be greater than zero.')
  }

  if (/stage entry not found/i.test(message)) {
    return new ProductionHistoryRepositoryError('not_found', 'The stage entry was not found.')
  }

  if (/Document-generated production history cannot be corrected here/i.test(message)) {
    return new ProductionHistoryRepositoryError('document_protected', 'This entry was created by a Bending document and cannot be edited from Production history.')
  }

  if (/Document-generated production history cannot be deleted here/i.test(message)) {
    return new ProductionHistoryRepositoryError('document_protected', 'This entry was created by a Bending document and cannot be deleted from Production history.')
  }

  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new ProductionHistoryRepositoryError('network', 'Unable to reach Production Control. Check your connection and try again.')
  }

  return new ProductionHistoryRepositoryError('unknown', action === 'correct' ? 'The correction could not be completed.' : action === 'delete' ? 'The deletion could not be completed.' : 'History could not be loaded.')
}

type StageEntryRowShape = Pick<
  Database['public']['Tables']['production_stage_entries']['Row'],
  | 'id'
  | 'production_item_id'
  | 'stage'
  | 'quantity'
  | 'entry_date'
  | 'note'
  | 'source'
  | 'source_reference'
  | 'created_at'
  | 'created_by'
  | 'performed_by'
  | 'performed_by_name_snapshot'
>

function mapStageEntryRow(row: StageEntryRowShape): ProductionStageEntry {
  let source: ProductionStageSource = 'manual'
  if (row.source === 'excel_import') source = 'excel_import'
  else if (row.source === 'document') source = 'document'

  return {
    id: row.id,
    productionItemId: row.production_item_id,
    stage: row.stage,
    quantity: row.quantity,
    entryDate: row.entry_date,
    note: row.note,
    source,
    sourceReference: row.source_reference,
    createdAt: row.created_at,
    createdBy: row.created_by,
    performedBy: row.performed_by,
    performedByName: row.performed_by_name_snapshot,
  }
}

function mapAuditRow(row: Database['public']['Tables']['production_stage_entry_audit']['Row']): ProductionStageEntryAudit {
  return {
    id: row.id,
    stageEntryId: row.stage_entry_id,
    action: row.action,
    reason: row.reason,
    oldData: row.old_data as Record<string, unknown> | null,
    newData: row.new_data as Record<string, unknown> | null,
    correctedBy: row.corrected_by,
    correctedByName: row.corrected_by_name,
    correctedAt: row.corrected_at,
  }
}

export const productionHistoryRepository = {
  async getHistory(filters: ProductionHistoryFilters): Promise<ProductionStageEntry[]> {
    const { data, error } = await supabase
      .from('production_stage_entries')
      .select('id, production_item_id, stage, quantity, entry_date, note, source, source_reference, created_at, created_by, performed_by, performed_by_name_snapshot')
      .eq('production_item_id', filters.productionItemId)
      .order('created_at', { ascending: false })

    if (error) throw mapError(error, 'history')

    return (data ?? []).map(mapStageEntryRow)
  },

  async getAudit(filters: ProductionHistoryFilters): Promise<ProductionStageEntryAudit[]> {
    const { data, error } = await supabase
      .from('production_stage_entry_audit')
      .select('id, stage_entry_id, production_item_id, action, reason, old_data, new_data, corrected_by, corrected_by_name, corrected_at')
      .eq('production_item_id', filters.productionItemId)
      .order('corrected_at', { ascending: false })

    if (error) throw mapError(error, 'audit')

    return (data ?? []).map(mapAuditRow)
  },

  async correctEntry(input: CorrectProductionStageEntryInput): Promise<ProductionStageEntry> {
    const { data, error } = await supabase.rpc('correct_production_stage_entry', {
      p_entry_id: input.entryId,
      p_quantity: input.quantity,
      p_entry_date: input.entryDate,
      p_note: input.note || null,
      p_reason: input.reason,
    })

    if (error) throw mapError(error, 'correct')

    return mapStageEntryRow(data)
  },

  async deleteEntry(input: DeleteProductionStageEntryInput): Promise<ProductionStageEntry> {
    const { data, error } = await supabase.rpc('delete_production_stage_entry', {
      p_entry_id: input.entryId,
      p_reason: input.reason,
    })

    if (error) throw mapError(error, 'delete')

    return mapStageEntryRow(data)
  },
}