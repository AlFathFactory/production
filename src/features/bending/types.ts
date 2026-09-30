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

export type BendingDestination = Database['public']['Tables']['bending_destinations']['Row']

export interface BendingDestinationSummary {
  destinationId: string
  destinationIsActive: boolean
  destinationName: string
  dispatchCount: number
  latestDispatchDate: string | null
  lotCount: number
  oldestOpenDispatchDate: string | null
  outstandingItemCount: number
  outstandingQuantity: number
  outstandingWeightKg: number
  projectCount: number
}

export interface BendingDestinationInventoryLine {
  article: string
  designation: string | null
  destinationId: string
  dispatchDate: string
  dispatchId: string
  dispatchItemId: string
  dispatchNumber: string
  issuedQuantity: number
  lastReturnDate: string | null
  lotId: string
  lotNumber: string
  material: string | null
  outstandingQuantity: number
  outstandingWeightKg: number
  productionItemId: string
  profile: string | null
  projectName: string
  projectNumber: string
  returnStatus: string
  returnedQuantity: number
  routing: string | null
  unitWeightKg: number | null
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

export interface BendingReturnDraftItem extends BendingDestinationInventoryLine {
  isSelected: boolean
  quantity: number
}

export interface BendingReturnHeaderValues {
  receivedByName: string
  returnDate: string
}

export interface CreateBendingReturnInput extends BendingReturnHeaderValues {
  dispatchId: string
  items: Array<{
    dispatch_item_id: string
    quantity: number
  }>
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
  destination: string | null
  items: BendingPdfItem[]
  originalDispatchNumber: string
  receivedByName: string | null
  returnDate: string
  returnReference: string
}

export type BendingPdfTarget =
  | { id: string; kind: 'dispatch'; pdfPath: string | null; reference: string }
  | { id: string; kind: 'return'; pdfPath: string | null; reference: string }
