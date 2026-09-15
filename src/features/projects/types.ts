import type { Database } from '../../types/database'

export type Project = Pick<
  Database['public']['Tables']['production_projects']['Row'],
  'id' | 'project_name' | 'notes' | 'is_active' | 'created_at' | 'updated_at'
>

export const hierarchyStatuses = ['active', 'completed', 'on_hold', 'cancelled'] as const
export type HierarchyStatus = (typeof hierarchyStatuses)[number]

export type ProjectNumber = Pick<
  Database['public']['Tables']['production_project_numbers']['Row'],
  'id' | 'project_id' | 'project_number' | 'notes' | 'created_at' | 'updated_at'
> & { status: HierarchyStatus }

export type Lot = Pick<
  Database['public']['Tables']['production_lots']['Row'],
  'id' | 'project_number_id' | 'lot_number' | 'notes' | 'created_at' | 'updated_at'
> & { status: HierarchyStatus }

export interface ProjectFormValues {
  projectName: string
  notes: string
  isActive: boolean
}

export interface ProjectNumberFormValues {
  projectNumber: string
  status: HierarchyStatus
  notes: string
}

export interface LotFormValues {
  lotNumber: string
  status: HierarchyStatus
  notes: string
}
