import { supabase } from '../../services/supabase/client'
import type {
  CreateProductionDispenseInput,
  DispenseHistoryFilters,
  DispenseHistoryRow,
  DispenseRecipient,
} from './types'

export type DispenseRepositoryErrorKind = 'duplicate' | 'network' | 'permission' | 'stock' | 'validation' | 'unknown'

export class DispenseRepositoryError extends Error {
  constructor(message: string, public readonly kind: DispenseRepositoryErrorKind) {
    super(message)
    this.name = 'DispenseRepositoryError'
  }
}

function errorDetails(error: unknown): { code: string; message: string } {
  if (typeof error !== 'object' || error === null) {
    return { code: '', message: error instanceof Error ? error.message : '' }
  }

  return {
    code: 'code' in error ? String(error.code) : '',
    message: 'message' in error ? String(error.message) : '',
  }
}

function cleanServerMessage(message: string): string {
  return message.replace(/\s+/g, ' ').trim().slice(0, 300)
}

function mapReadError(error: unknown): DispenseRepositoryError {
  const { code, message } = errorDetails(error)
  if (code === '42501' || /permission denied/i.test(message)) {
    return new DispenseRepositoryError('You do not have permission to view DISPENSE data.', 'permission')
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new DispenseRepositoryError('Unable to reach Production Control. Check your connection and try again.', 'network')
  }
  return new DispenseRepositoryError('DISPENSE data could not be loaded. Please try again.', 'unknown')
}

function mapRecipientError(error: unknown): DispenseRepositoryError {
  const { code, message } = errorDetails(error)
  if (code === '23505' || /already exists|duplicate|unique/i.test(message)) {
    return new DispenseRepositoryError('A person with this name already exists.', 'duplicate')
  }
  if (code === '42501' || /permission denied|authentication required/i.test(message)) {
    return new DispenseRepositoryError('You do not have permission to add DISPENSE recipients.', 'permission')
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new DispenseRepositoryError('Unable to reach Production Control. Check your connection and try again.', 'network')
  }
  return new DispenseRepositoryError('The person could not be saved. Please try again.', 'unknown')
}

function mapCreateDispenseError(error: unknown): DispenseRepositoryError {
  const { code, message } = errorDetails(error)
  const detail = cleanServerMessage(message)

  if (/DISPENSE quantity would exceed|warehouse stock|available stock|stock validation/i.test(message)) {
    return new DispenseRepositoryError(detail || 'DISPENSE quantity exceeds current warehouse stock.', 'stock')
  }
  if (/recipient.*required|at least one.*item|quantity must be greater than zero|invalid.*item/i.test(message)) {
    return new DispenseRepositoryError(detail || 'The DISPENSE request is incomplete or invalid.', 'validation')
  }
  if (code === '42501' || /permission denied|authentication required/i.test(message)) {
    return new DispenseRepositoryError('You do not have permission to create DISPENSE operations.', 'permission')
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new DispenseRepositoryError('Unable to reach Production Control. Check your connection and try again.', 'network')
  }
  return new DispenseRepositoryError(detail || 'The DISPENSE operation could not be created. Please try again.', 'unknown')
}

export const dispenseRepository = {
  async listRecipients(): Promise<DispenseRecipient[]> {
    const { data, error } = await supabase
      .from('dispense_recipients')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw mapReadError(error)
    return data
  },

  async createRecipient(name: string, createdBy: string): Promise<DispenseRecipient> {
    const { data, error } = await supabase
      .from('dispense_recipients')
      .insert({ created_by: createdBy, name: name.trim() })
      .select('*')
      .single()

    if (error) throw mapRecipientError(error)
    return data
  },

  async createProductionDispense(input: CreateProductionDispenseInput): Promise<void> {
    const { error } = await supabase.rpc('create_production_dispense', {
      p_entry_date: input.entryDate,
      p_items: input.items.map((item) => ({
        production_item_id: item.productionItemId,
        quantity: item.quantity,
      })),
      p_note: input.note.trim() || undefined,
      p_recipient_name: input.recipientName.trim(),
    })

    if (error) throw mapCreateDispenseError(error)
  },

  async searchHistory(filters: DispenseHistoryFilters): Promise<DispenseHistoryRow[]> {
    const { data, error } = await supabase.rpc('search_production_dispense_history', {
      p_date_from: filters.dateFrom ?? undefined,
      p_date_to: filters.dateTo ?? undefined,
      p_lot_id: filters.lotId ?? undefined,
      p_project_id: filters.projectId ?? undefined,
      p_project_number_id: filters.projectNumberId ?? undefined,
      p_query: filters.query.trim() || undefined,
      p_recipient_id: filters.recipientId ?? undefined,
      p_recipient_name: filters.recipientName.trim() || undefined,
    })

    if (error) throw mapReadError(error)
    return data
  },
}
