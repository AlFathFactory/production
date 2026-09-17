import type { Database } from '../../types/database'

export type DocumentType = 'bending_dispatch' | 'bending_return'
export type PdfStatus = 'attached' | 'missing'

export interface DocumentsFilters {
  documentType: DocumentType | null
  lotId: string | null
  pdfStatus: PdfStatus | null
  projectId: string | null
  projectNumberId: string | null
  search: string
}

export interface ProductionDocument {
  createdAt: string | null
  createdByName: string | null
  documentDate: string
  documentId: string
  documentReference: string
  documentType: DocumentType
  lotId: string | null
  lotNumber: string | null
  pdfPath: string | null
  projectId: string | null
  projectName: string | null
  projectNumber: string | null
  projectNumberId: string | null
}

export type ProductionDocumentsRegisterRow = Database['public']['Views']['production_documents_register']['Row']
