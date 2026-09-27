import type { Database } from '../../types/database'

export type ReportOperation = Database['public']['Enums']['production_stage']
export type ReportRow = Database['public']['Functions']['search_production_operations_report']['Returns'][number]

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
