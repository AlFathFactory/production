import { supabase } from '../../services/supabase/client'
import type { BendingDispatchResult, CreateBendingDispatchInput } from './types'

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

  return new BendingRepositoryError('The Bending Dispatch could not be created. Please try again.', 'unknown')
}

export function shouldRefreshBendingAvailability(error: unknown): boolean {
  return error instanceof BendingRepositoryError
    && (error.kind === 'availability' || error.kind === 'not_found' || error.kind === 'route')
}

export const bendingRepository = {
  async createDispatch(input: CreateBendingDispatchInput): Promise<BendingDispatchResult> {
    const { data, error } = await supabase.rpc('create_bending_dispatch', {
      p_approval_name: input.approvalName.trim() || null,
      p_destination: input.destination.trim() || null,
      p_dispatch_date: input.dispatchDate,
      p_dispatch_name: input.dispatchName.trim() || null,
      p_dispatch_number: input.dispatchNumber.trim(),
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
}
