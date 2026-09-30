import { supabase } from '../../services/supabase/client'
import { toFiniteNumber, toNullableNumber } from '../production/utils'
import type {
  BendingDestination,
  BendingDestinationInventoryLine,
  BendingDestinationSummary,
  BendingDispatchListItem,
  BendingDispatchResult,
  BendingReturnLine,
  BendingReturnResult,
  CreateBendingDispatchInput,
  CreateBendingReturnInput,
} from './types'

export type BendingRepositoryErrorKind = 'availability' | 'duplicate' | 'invalid' | 'network' | 'not_found' | 'permission' | 'route' | 'unknown'

export class BendingRepositoryError extends Error {
  constructor(message: string, public readonly kind: BendingRepositoryErrorKind) {
    super(message)
    this.name = 'BendingRepositoryError'
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

function logBendingError(action: string, error: unknown): void {
  const { code, message } = errorDetails(error)
  console.error(`[bending] ${action} failed`, { code: code || undefined, message: message || undefined, error })
}

function sanitizedServerDetail(message: string): string {
  return message.replace(/\s+/g, ' ').trim().slice(0, 220)
}

function mapCreateDispatchError(error: unknown): BendingRepositoryError {
  const { code, message } = errorDetails(error)

  if (code === '23505' && /dispatch_number|bending_dispatches_dispatch_number/i.test(message)) {
    return new BendingRepositoryError('A dispatch with this number already exists.', 'duplicate')
  }
  if (/OUT_BEND quantity would exceed CUT quantity/i.test(message)) {
    return new BendingRepositoryError(
      'Available quantity changed while this dispatch was being prepared. Production data has been refreshed. Please review the quantities and try again.',
      'availability',
    )
  }
  if (/Production item not found in selected lot|Lot not found/i.test(message)) {
    return new BendingRepositoryError('A selected material or Lot is no longer available. Production data has been refreshed.', 'not_found')
  }
  if (/Only BEND route items|OUT_BEND is only allowed for BEND/i.test(message)) {
    return new BendingRepositoryError('A selected material is no longer eligible for Bending Dispatch.', 'route')
  }
  if (/quantity must be greater than zero|At least one dispatch item|Dispatch number is required|invalid input syntax/i.test(message)) {
    return new BendingRepositoryError('The dispatch contains invalid or incomplete information. Please review it and try again.', 'invalid')
  }
  if (code === '42501' || /Supervisor or admin role required|Authentication required|permission denied/i.test(message)) {
    return new BendingRepositoryError('You do not have permission to create Bending Dispatches.', 'permission')
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new BendingRepositoryError('Unable to reach Production Control. Check your connection and try again.', 'network')
  }

  logBendingError('create bending dispatch', error)
  return new BendingRepositoryError('The Bending Dispatch could not be created. Please try again.', 'unknown')
}

function mapBendingReadError(error: unknown): BendingRepositoryError {
  const { code, message } = errorDetails(error)

  if (code === '42501' || /permission denied/i.test(message)) {
    return new BendingRepositoryError('You do not have permission to view Bending documents.', 'permission')
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new BendingRepositoryError('Unable to reach Production Control. Check your connection and try again.', 'network')
  }

  return new BendingRepositoryError('Bending documents could not be loaded. Please try again.', 'unknown')
}

function mapCreateReturnError(error: unknown): BendingRepositoryError {
  const { code, message } = errorDetails(error)

  if (code === '23505' && /return_reference|bending_returns_return_reference/i.test(message)) {
    return new BendingRepositoryError('A Bending Return with this reference already exists.', 'duplicate')
  }
  if (/exceed.*outstanding|BEND quantity would exceed OUT_BEND quantity/i.test(message)) {
    return new BendingRepositoryError(
      'Outstanding quantity changed while this return was being prepared. The dispatch has been refreshed. Please review and try again.',
      'availability',
    )
  }
  if (/Bending dispatch not found|Dispatch item not found|does not belong to.*dispatch/i.test(message)) {
    return new BendingRepositoryError('The selected dispatch changed or is no longer available. The dispatch has been refreshed.', 'not_found')
  }
  if (/quantity must be greater than zero|At least one return item|Return reference is required|invalid input syntax/i.test(message)) {
    return new BendingRepositoryError('The return contains invalid or incomplete information. Please review it and try again.', 'invalid')
  }
  if (code === '42501' || /Supervisor or admin role required|Authentication required|permission denied/i.test(message)) {
    return new BendingRepositoryError('You do not have permission to create Bending Returns.', 'permission')
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new BendingRepositoryError('Unable to reach Production Control. Check your connection and try again.', 'network')
  }

  logBendingError('create bending return', error)
  const detail = sanitizedServerDetail(message)
  return new BendingRepositoryError(
    detail
      ? `The Bending Return could not be created. Server said: ${detail}`
      : 'The Bending Return could not be created. Please try again.',
    'unknown',
  )
}

function mapCreateDestinationError(error: unknown): BendingRepositoryError {
  const { code, message } = errorDetails(error)

  if (code === '23505' || /already exists|duplicate|unique/i.test(message)) {
    return new BendingRepositoryError('A Destination with this name already exists.', 'duplicate')
  }
  if (code === '42501' || /Authentication required|permission denied/i.test(message)) {
    return new BendingRepositoryError('You do not have permission to create Destinations.', 'permission')
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new BendingRepositoryError('Unable to reach Production Control. Check your connection and try again.', 'network')
  }

  logBendingError('create bending destination', error)
  return new BendingRepositoryError('The Destination could not be created. Please try again.', 'unknown')
}

export function shouldRefreshBendingAvailability(error: unknown): boolean {
  return error instanceof BendingRepositoryError
    && (error.kind === 'availability' || error.kind === 'not_found' || error.kind === 'route')
}

export function shouldRefreshBendingReturn(error: unknown): boolean {
  return error instanceof BendingRepositoryError
    && (error.kind === 'availability' || error.kind === 'not_found')
}

export const bendingRepository = {
  async listDestinations(): Promise<BendingDestination[]> {
    const { data, error } = await supabase
      .from('bending_destinations')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      throw mapBendingReadError(error)
    }

    return data
  },

  async createDestination(name: string, createdBy: string): Promise<BendingDestination> {
    const { data, error } = await supabase
      .from('bending_destinations')
      .insert({ created_by: createdBy, name: name.trim() })
      .select('*')
      .single()

    if (error) {
      throw mapCreateDestinationError(error)
    }

    return data
  },

  async listDestinationSummaries(): Promise<BendingDestinationSummary[]> {
    const { data, error } = await supabase
      .from('bending_destination_summary')
      .select('*')
      .eq('destination_is_active', true)
      .order('outstanding_item_count', { ascending: false })
      .order('destination_name', { ascending: true })

    if (error) {
      throw mapBendingReadError(error)
    }

    return data.flatMap((row) => row.destination_id && row.destination_name
      ? [{
        destinationId: row.destination_id,
        destinationIsActive: row.destination_is_active ?? false,
        destinationName: row.destination_name,
        dispatchCount: toFiniteNumber(row.dispatch_count),
        latestDispatchDate: row.latest_dispatch_date,
        lotCount: toFiniteNumber(row.lot_count),
        oldestOpenDispatchDate: row.oldest_open_dispatch_date,
        outstandingItemCount: toFiniteNumber(row.outstanding_item_count),
        outstandingQuantity: toFiniteNumber(row.outstanding_quantity),
        outstandingWeightKg: toFiniteNumber(row.outstanding_weight_kg),
        projectCount: toFiniteNumber(row.project_count),
      }]
      : [])
  },

  async searchDestinationInventory(destinationId: string): Promise<BendingDestinationInventoryLine[]> {
    const { data, error } = await supabase.rpc('search_bending_destination_inventory', {
      p_destination_id: destinationId,
      p_outstanding_only: true,
    })

    if (error) {
      throw mapBendingReadError(error)
    }

    return data.flatMap((row) => (
      row.article
      && row.destination_id
      && row.dispatch_date
      && row.dispatch_id
      && row.dispatch_item_id
      && row.dispatch_number
      && row.lot_id
      && row.lot_number
      && row.production_item_id
      && row.project_name
      && row.project_number
      ? [{
        article: row.article,
        designation: row.designation,
        destinationId: row.destination_id,
        dispatchDate: row.dispatch_date,
        dispatchId: row.dispatch_id,
        dispatchItemId: row.dispatch_item_id,
        dispatchNumber: row.dispatch_number,
        issuedQuantity: toFiniteNumber(row.issued_quantity),
        lastReturnDate: row.last_return_date,
        lotId: row.lot_id,
        lotNumber: row.lot_number,
        material: row.material,
        outstandingQuantity: toFiniteNumber(row.outstanding_quantity),
        outstandingWeightKg: toFiniteNumber(row.outstanding_weight_kg),
        productionItemId: row.production_item_id,
        profile: row.profile,
        projectName: row.project_name,
        projectNumber: row.project_number,
        returnStatus: row.return_status ?? 'Not Returned',
        returnedQuantity: toFiniteNumber(row.returned_quantity),
        routing: row.routing,
        unitWeightKg: toNullableNumber(row.unit_weight_kg),
      }]
      : []
    ))
  },

  async listDispatchesByLot(lotId: string): Promise<BendingDispatchListItem[]> {
    const { data, error } = await supabase
      .from('bending_dispatches')
      .select('id, dispatch_number, dispatch_date, destination, sheet_number, created_at')
      .eq('lot_id', lotId)
      .order('dispatch_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw mapBendingReadError(error)
    }

    return data.map((dispatch) => ({
      createdAt: dispatch.created_at,
      destination: dispatch.destination,
      dispatchDate: dispatch.dispatch_date,
      dispatchNumber: dispatch.dispatch_number,
      id: dispatch.id,
      sheetNumber: dispatch.sheet_number,
    }))
  },

  async getReturnLinesForDispatch(dispatchId: string): Promise<BendingReturnLine[]> {
    const [dispatchItemsResult, returnsResult] = await Promise.all([
      supabase
        .from('bending_dispatch_items')
        .select('id, production_item_id, quantity, designation_snapshot, profile_snapshot, unit_weight_kg_snapshot')
        .eq('dispatch_id', dispatchId),
      supabase
        .from('bending_returns')
        .select('id')
        .eq('dispatch_id', dispatchId),
    ])

    if (dispatchItemsResult.error) {
      throw mapBendingReadError(dispatchItemsResult.error)
    }
    if (returnsResult.error) {
      throw mapBendingReadError(returnsResult.error)
    }

    const dispatchItems = dispatchItemsResult.data
    const returnIds = returnsResult.data.map((returnDocument) => returnDocument.id)
    const productionItemIds = dispatchItems.map((item) => item.production_item_id)
    const [productionItemsResult, returnItemsResult] = await Promise.all([
      productionItemIds.length === 0
        ? Promise.resolve({ data: [], error: null })
        : supabase.from('production_items').select('id, article').in('id', productionItemIds),
      returnIds.length === 0
        ? Promise.resolve({ data: [], error: null })
        : supabase.from('bending_return_items').select('dispatch_item_id, quantity').in('return_id', returnIds),
    ])

    if (productionItemsResult.error) {
      throw mapBendingReadError(productionItemsResult.error)
    }
    if (returnItemsResult.error) {
      throw mapBendingReadError(returnItemsResult.error)
    }

    const articles = new Map(productionItemsResult.data.map((item) => [item.id, item.article]))
    const returnedTotals = new Map<string, number>()
    for (const returnItem of returnItemsResult.data) {
      returnedTotals.set(
        returnItem.dispatch_item_id,
        (returnedTotals.get(returnItem.dispatch_item_id) ?? 0) + returnItem.quantity,
      )
    }

    return dispatchItems.map((item) => {
      const previousReturnedQuantity = returnedTotals.get(item.id) ?? 0
      return {
        article: articles.get(item.production_item_id) ?? 'Unknown article',
        designation: item.designation_snapshot,
        dispatchItemId: item.id,
        outstandingQuantity: Math.max(0, item.quantity - previousReturnedQuantity),
        previousReturnedQuantity,
        productionItemId: item.production_item_id,
        profile: item.profile_snapshot,
        sentQuantity: item.quantity,
        unitWeightKg: item.unit_weight_kg_snapshot,
      }
    })
  },

  async createDispatch(input: CreateBendingDispatchInput): Promise<BendingDispatchResult> {
    const { data, error } = await supabase.rpc('create_bending_dispatch', {
      p_approval_name: input.approvalName.trim() || null,
      p_destination: input.destination.trim() || null,
      p_dispatch_date: input.dispatchDate,
      p_dispatch_name: input.dispatchName.trim() || null,
      p_dispatch_number: '',
      p_follow_name: input.followName.trim() || null,
      p_items: input.items,
      p_lot_id: input.lotId,
      p_sheet_number: input.sheetNumber.trim() || null,
    })

    if (error) {
      throw mapCreateDispatchError(error)
    }
    if (!data) {
      throw new BendingRepositoryError('The dispatch returned an unexpected response. Please refresh and try again.', 'unknown')
    }

    return data
  },

  async createReturn(input: CreateBendingReturnInput): Promise<BendingReturnResult> {
    const { data: returnId, error } = await supabase.rpc('create_bending_return', {
      p_dispatch_id: input.dispatchId,
      p_items: input.items,
      p_received_by_name: input.receivedByName.trim() || null,
      p_return_date: input.returnDate,
      p_return_reference: input.returnReference.trim(),
    })

    if (error) {
      throw mapCreateReturnError(error)
    }
    if (!returnId) {
      throw new BendingRepositoryError('The return was created without a valid document ID. Please refresh Documents before continuing.', 'unknown')
    }

    const { data: createdReturn, error: createdReturnError } = await supabase
      .from('bending_returns')
      .select('*')
      .eq('id', returnId)
      .single()

    if (createdReturnError || !createdReturn) {
      throw new BendingRepositoryError(
        'The Bending Return was created, but its details could not be loaded for the PDF. Refresh Documents before continuing.',
        'unknown',
      )
    }

    return createdReturn
  },
}
