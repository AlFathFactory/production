import { supabase } from '../../services/supabase/client'
import type { BendingDispatchPdfModel, BendingPdfItem, BendingReturnPdfModel } from './types'

export type BendingPdfRepositoryErrorKind = 'load' | 'network' | 'permission' | 'update'

export class BendingPdfRepositoryError extends Error {
  constructor(message: string, public readonly kind: BendingPdfRepositoryErrorKind) {
    super(message)
    this.name = 'BendingPdfRepositoryError'
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

function mapPdfReadError(error: unknown): BendingPdfRepositoryError {
  const { code, message } = errorDetails(error)
  if (code === '42501' || /permission denied/i.test(message)) {
    return new BendingPdfRepositoryError('You do not have permission to load the PDF data.', 'permission')
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new BendingPdfRepositoryError('Unable to load the PDF data. Check your connection and retry.', 'network')
  }
  return new BendingPdfRepositoryError('The document data needed for the PDF could not be loaded.', 'load')
}

function mapPdfUpdateError(error: unknown): BendingPdfRepositoryError {
  const { code, message } = errorDetails(error)
  if (code === '42501' || /permission denied|role required|Authentication required/i.test(message)) {
    return new BendingPdfRepositoryError(
      'You do not have permission to attach this PDF.',
      'permission',
    )
  }
  if (code === '22023') {
    return new BendingPdfRepositoryError('The generated PDF path was rejected as invalid.', 'update')
  }
  if (code === 'P0002' || /not found/i.test(message)) {
    return new BendingPdfRepositoryError('The document no longer exists, so the PDF could not be attached.', 'update')
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new BendingPdfRepositoryError('The PDF was uploaded, but pdf_path could not be saved. Check your connection and retry.', 'network')
  }
  return new BendingPdfRepositoryError('The PDF was uploaded, but pdf_path could not be saved. Retry the attachment.', 'update')
}

async function getHierarchy(lotId: string) {
  const lotResult = await supabase
    .from('production_lots')
    .select('lot_number, project_number_id')
    .eq('id', lotId)
    .single()
  if (lotResult.error) throw mapPdfReadError(lotResult.error)

  const projectNumberResult = await supabase
    .from('production_project_numbers')
    .select('project_number, project_id')
    .eq('id', lotResult.data.project_number_id)
    .single()
  if (projectNumberResult.error) throw mapPdfReadError(projectNumberResult.error)

  const projectResult = await supabase
    .from('production_projects')
    .select('project_name')
    .eq('id', projectNumberResult.data.project_id)
    .single()
  if (projectResult.error) throw mapPdfReadError(projectResult.error)

  return {
    lot: lotResult.data.lot_number,
    project: projectResult.data.project_name,
    projectNumber: projectNumberResult.data.project_number,
  }
}

async function getArticles(productionItemIds: string[]): Promise<Map<string, string>> {
  if (productionItemIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('production_items')
    .select('id, article')
    .in('id', productionItemIds)
  if (error) throw mapPdfReadError(error)

  return new Map(data.map((item) => [item.id, item.article]))
}

export const bendingPdfRepository = {
  async getDispatchModel(dispatchId: string): Promise<BendingDispatchPdfModel> {
    const [dispatchResult, itemsResult] = await Promise.all([
      supabase.from('bending_dispatches').select('*').eq('id', dispatchId).single(),
      supabase
        .from('bending_dispatch_items')
        .select('production_item_id, quantity, designation_snapshot, profile_snapshot, unit_weight_kg_snapshot, remark_snapshot')
        .eq('dispatch_id', dispatchId)
        .order('created_at', { ascending: true }),
    ])
    if (dispatchResult.error) throw mapPdfReadError(dispatchResult.error)
    if (itemsResult.error) throw mapPdfReadError(itemsResult.error)

    const [hierarchy, articles] = await Promise.all([
      getHierarchy(dispatchResult.data.lot_id),
      getArticles(itemsResult.data.map((item) => item.production_item_id)),
    ])
    const items: BendingPdfItem[] = itemsResult.data.map((item) => ({
      article: articles.get(item.production_item_id) ?? 'Unknown article',
      designation: item.designation_snapshot,
      profile: item.profile_snapshot,
      quantity: item.quantity,
      remark: item.remark_snapshot,
      unitWeightKg: item.unit_weight_kg_snapshot,
    }))

    return {
      ...hierarchy,
      approvalName: dispatchResult.data.approval_name,
      destination: dispatchResult.data.destination,
      dispatchDate: dispatchResult.data.dispatch_date,
      dispatchName: dispatchResult.data.dispatch_name,
      dispatchNumber: dispatchResult.data.dispatch_number,
      followName: dispatchResult.data.follow_name,
      items,
      sheetNumber: dispatchResult.data.sheet_number,
    }
  },

  async getReturnModel(returnId: string): Promise<BendingReturnPdfModel> {
    const [returnResult, itemsResult] = await Promise.all([
      supabase.from('bending_returns').select('*').eq('id', returnId).single(),
      supabase
        .from('bending_return_items')
        .select('production_item_id, quantity, designation_snapshot, profile_snapshot, unit_weight_kg_snapshot')
        .eq('return_id', returnId)
        .order('created_at', { ascending: true }),
    ])
    if (returnResult.error) throw mapPdfReadError(returnResult.error)
    if (itemsResult.error) throw mapPdfReadError(itemsResult.error)

    const [hierarchy, articles, dispatchResult] = await Promise.all([
      getHierarchy(returnResult.data.lot_id),
      getArticles(itemsResult.data.map((item) => item.production_item_id)),
      supabase
        .from('bending_dispatches')
        .select('dispatch_number')
        .eq('id', returnResult.data.dispatch_id)
        .single(),
    ])
    if (dispatchResult.error) throw mapPdfReadError(dispatchResult.error)

    return {
      ...hierarchy,
      items: itemsResult.data.map((item) => ({
        article: articles.get(item.production_item_id) ?? 'Unknown article',
        designation: item.designation_snapshot,
        profile: item.profile_snapshot,
        quantity: item.quantity,
        unitWeightKg: item.unit_weight_kg_snapshot,
      })),
      originalDispatchNumber: dispatchResult.data.dispatch_number,
      receivedByName: returnResult.data.received_by_name,
      returnDate: returnResult.data.return_date,
      returnReference: returnResult.data.return_reference,
    }
  },

  async saveDispatchPdfPath(dispatchId: string, pdfPath: string): Promise<string> {
    const { data, error } = await supabase.rpc('attach_bending_dispatch_pdf', {
      p_dispatch_id: dispatchId,
      p_pdf_path: pdfPath,
    })
    if (error) throw mapPdfUpdateError(error)
    if (!data?.pdf_path) {
      throw new BendingPdfRepositoryError('The Dispatch PDF attachment returned an unexpected response.', 'update')
    }
    return data.pdf_path
  },

  async saveReturnPdfPath(returnId: string, pdfPath: string): Promise<string> {
    const { data, error } = await supabase.rpc('attach_bending_return_pdf', {
      p_pdf_path: pdfPath,
      p_return_id: returnId,
    })
    if (error) throw mapPdfUpdateError(error)
    if (!data?.pdf_path) {
      throw new BendingPdfRepositoryError('The Return PDF attachment returned an unexpected response.', 'update')
    }
    return data.pdf_path
  },
}
