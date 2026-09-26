import type { Database } from '../../types/database'

export interface BendingDispatchDraftItem {
  article: string
  availableQuantity: number
  designation: string | null
  productionItemId: string
  profile: string | null
  quantity: number
  unitWeightKg: number | null
}

export interface BendingDispatchHeaderValues {
  approvalName: string
  destination: string
  dispatchDate: string
  dispatchName: string
  followName: string
  sheetNumber: string
}

export interface CreateBendingDispatchInput extends BendingDispatchHeaderValues {
  items: Array<{
    production_item_id: string
    quantity: number
  }>
  lotId: string
}

export type BendingDispatchResult = Database['public']['Tables']['bending_dispatches']['Row']

export interface BendingDispatchSuccess {
  dispatchNumber: string
  itemCount: number
  totalQuantity: number
}

export interface BendingDispatchListItem {
  createdAt: string
  destination: string | null
  dispatchDate: string
  dispatchNumber: string
  id: string
  sheetNumber: string | null
}

export interface BendingReturnLine {
  article: string
  designation: string | null
  dispatchItemId: string
  outstandingQuantity: number
  previousReturnedQuantity: number
  productionItemId: string
  profile: string | null
  sentQuantity: number
  unitWeightKg: number | null
}

export interface BendingReturnDraftItem extends BendingReturnLine {
  quantity: number
}

export interface BendingReturnHeaderValues {
  receivedByName: string
  returnDate: string
  returnReference: string
}

export interface CreateBendingReturnInput extends BendingReturnHeaderValues {
  dispatchId: string
  items: Array<{
    dispatch_item_id: string
    quantity: number
  }>
  lotId: string
}

export type BendingReturnResult = Database['public']['Tables']['bending_returns']['Row']

export interface BendingReturnSuccess {
  itemCount: number
  returnReference: string
  totalQuantity: number
}

export interface BendingPdfItem {
  article: string
  designation: string | null
  profile: string | null
  quantity: number
  remark?: string | null
  unitWeightKg: number | null
}

interface BendingPdfHierarchy {
  lot: string
  project: string
  projectNumber: string
}

export interface BendingDispatchPdfModel extends BendingPdfHierarchy {
  approvalName: string | null
  destination: string | null
  dispatchDate: string
  dispatchName: string | null
  dispatchNumber: string
  followName: string | null
  items: BendingPdfItem[]
  sheetNumber: string | null
}

export interface BendingReturnPdfModel extends BendingPdfHierarchy {
  items: BendingPdfItem[]
  originalDispatchNumber: string
  receivedByName: string | null
  returnDate: string
  returnReference: string
}

export type BendingPdfTarget =
  | { id: string; kind: 'dispatch'; pdfPath: string | null; reference: string }
  | { id: string; kind: 'return'; pdfPath: string | null; reference: string }
