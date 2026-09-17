import { supabase } from '../../services/supabase/client'
import type { DocumentsFilters, DocumentType, ProductionDocument, ProductionDocumentsRegisterRow } from './types'

type DocumentsRegisterSelection = Pick<
  ProductionDocumentsRegisterRow,
  | 'created_at'
  | 'created_by_name'
  | 'document_date'
  | 'document_id'
  | 'document_reference'
  | 'document_type'
  | 'lot_id'
  | 'lot_number'
  | 'pdf_path'
  | 'project_id'
  | 'project_name'
  | 'project_number'
  | 'project_number_id'
>

export class DocumentsRepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocumentsRepositoryError'
  }
}

function mapDocumentsError(error: unknown): DocumentsRepositoryError {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  const message = error instanceof Error ? error.message : ''

  if (code === '42501' || /permission denied/i.test(message)) {
    return new DocumentsRepositoryError('You do not have permission to view the Documents register.')
  }
  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new DocumentsRepositoryError('Unable to reach Production Control. Check your connection and try again.')
  }
  return new DocumentsRepositoryError('The Documents register could not be loaded. Please try again.')
}

function toDocumentType(value: string | null): DocumentType {
  if (value === 'bending_dispatch' || value === 'bending_return') return value
  throw new DocumentsRepositoryError('The Documents register returned an unsupported document type.')
}

function mapRegisterRow(row: DocumentsRegisterSelection): ProductionDocument {
  if (!row.document_id || !row.document_reference || !row.document_date) {
    throw new DocumentsRepositoryError('The Documents register returned an incomplete document record.')
  }

  return {
    createdAt: row.created_at,
    createdByName: row.created_by_name,
    documentDate: row.document_date,
    documentId: row.document_id,
    documentReference: row.document_reference,
    documentType: toDocumentType(row.document_type),
    lotId: row.lot_id,
    lotNumber: row.lot_number,
    pdfPath: row.pdf_path,
    projectId: row.project_id,
    projectName: row.project_name,
    projectNumber: row.project_number,
    projectNumberId: row.project_number_id,
  }
}

function escapeIlike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export const documentsRepository = {
  async listDocuments(filters: DocumentsFilters): Promise<ProductionDocument[]> {
    let query = supabase
      .from('production_documents_register')
      .select('document_id, document_type, document_reference, document_date, lot_id, lot_number, project_number_id, project_number, project_id, project_name, pdf_path, created_by_name, created_at')
      .order('document_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters.projectId) query = query.eq('project_id', filters.projectId)
    if (filters.projectNumberId) query = query.eq('project_number_id', filters.projectNumberId)
    if (filters.lotId) query = query.eq('lot_id', filters.lotId)
    if (filters.documentType) query = query.eq('document_type', filters.documentType)
    if (filters.pdfStatus === 'attached') query = query.not('pdf_path', 'is', null)
    if (filters.pdfStatus === 'missing') query = query.is('pdf_path', null)
    if (filters.search.trim()) query = query.ilike('document_reference', `%${escapeIlike(filters.search.trim())}%`)

    const { data, error } = await query
    if (error) throw mapDocumentsError(error)

    return data.map(mapRegisterRow)
  },
}
