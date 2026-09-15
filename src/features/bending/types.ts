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
  dispatchNumber: string
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
