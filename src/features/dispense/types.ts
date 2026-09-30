import type { Database } from '../../types/database'

export type DispenseRecipient = Database['public']['Tables']['dispense_recipients']['Row']
export type DispenseHistoryRow = Database['public']['Functions']['search_production_dispense_history']['Returns'][number]

export interface DispenseItemInput {
  productionItemId: string
  quantity: number
}

export interface CreateProductionDispenseInput {
  entryDate: string
  items: DispenseItemInput[]
  note: string
  recipientName: string
}

export interface DispenseSelectionItem {
  article: string
  availableQuantity: number
  designation: string | null
  productionItemId: string
}

export interface DispenseHistoryFilters {
  recipientId: string | null
  recipientName: string
  dateFrom: string | null
  dateTo: string | null
  projectId: string | null
  projectNumberId: string | null
  lotId: string | null
  query: string
}
