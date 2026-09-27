import type { Database } from '../../types/database'

export type ReportOperation = Database['public']['Enums']['production_stage']
export type ReportRow = Database['public']['Functions']['search_production_operations_report']['Returns'][number] & {
  article_total_quantity: number | string | null
}
export type CurrentStatusRow = Database['public']['Functions']['search_production_status_report']['Returns'][number]
export type ReportsMode = 'historical-events' | 'current-status'
export type CurrentStatus =
  | 'REMAINING_CUT'
  | 'WAITING_ISSUE_PACKING'
  | 'WAITING_RECEIVE_PACKING'
  | 'WAITING_ROLLING'
  | 'READY_TO_DISPENSE'
  | 'PARTIALLY_DISPENSED'
  | 'COMPLETED'
  | 'NOT_STARTED'

export interface ReportFilters {
  dateFrom: string | null
  dateTo: string | null
  projectId: string | null
  projectNumberId: string | null
  lotId: string | null
  operations: ReportOperation[]
  routing: Database['public']['Enums']['production_route'] | null
  query: string
  performedBy: string
}

export interface ReportContextLabels {
  project: string
  projectNumber: string
  lot: string
  performedBy: string
}

export interface ReportContextData {
  period: string
  project: string
  projectNumber: string
  lot: string
  operations: string
  routing: string | null
  performedBy: string | null
  searchText: string | null
}

export interface CurrentStatusFilters {
  projectId: string | null
  projectNumberId: string | null
  lotId: string | null
  statuses: CurrentStatus[]
  routing: Database['public']['Enums']['production_route'] | null
  query: string
  progressState: 'not_started' | 'in_progress' | 'completed' | null
}

export interface CurrentStatusContextLabels {
  project: string
  projectNumber: string
  lot: string
}
