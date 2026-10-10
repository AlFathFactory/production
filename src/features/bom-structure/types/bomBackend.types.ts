import type { Json } from '../../../types/database'

export type BomImportStatus = 'parsed' | 'saved' | 'failed' | 'superseded'
export type BomDimensionRole = 'profile' | 'length' | 'width' | 'height' | 'unassigned'

export interface BomImportRow {
  id: string
  file_name: string
  created_by: string
  status: BomImportStatus
  created_at: string
  project_id: string | null
  project_number_id: string | null
  lot_id: string | null
  sheet_name: string | null
  header_row: number | null
  root_code: string | null
  parser_version: string | null
  source_file_bucket: string | null
  source_file_path: string | null
  source_file_name: string | null
  source_file_mime_type: string | null
  source_file_size_bytes: number | null
  source_file_sha256: string | null
  source_file_uploaded_at: string | null
  version_group_id: string
  version_number: number
  supersedes_import_id: string | null
  superseded_by_import_id: string | null
  activated_at: string | null
  updated_at: string
  updated_by: string | null
}

export interface BomNodeRow {
  id: string
  bom_import_id: string
  parent_id: string | null
  level: number
  source_row: number
  code: string | null
  parent_code: string | null
  position: string | null
  article_type: string | null
  item_type: string
  source_type: string | null
  name: string | null
  name2: string | null
  description: string | null
  drawing_number: string | null
  material: string | null
  quantity_per_parent: number
  calculated_cumulative_quantity: number
  excel_cumulative_quantity: number | null
  position_weight_kg: number | null
  rolled_weight_kg: number
  raw_data: Json
  formatted_raw_data: Json
  created_at: string
  updated_at: string
}

export type BomTreeNodeRow = Omit<BomNodeRow, 'raw_data' | 'formatted_raw_data' | 'created_at' | 'updated_at'>

export interface BomWarningRow {
  id: string
  bom_import_id: string
  warning_index: number
  kind: string
  source_row: number | null
  message: string
  details: Json
  created_at: string
  created_by: string
}

export interface BomDimensionMappingRow {
  id: string
  code: string | null
  description: string
  token_index: number
  token_raw: string
  token_value: number | null
  role: BomDimensionRole
  created_by: string
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type BomDimensionMappingLookupRow = Omit<BomDimensionMappingRow, 'updated_by'> & {
  match_scope: string
}

export interface BomSummaryRow {
  bom_import_id: string | null
  root_code: string | null
  rows: number | null
  levels: number | null
  unique_codes: number | null
  assemblies: number | null
  parts: number | null
  materials: number | null
  leaf_items: number | null
  total_calculated_leaf_mass_kg: number | null
}

export interface BomReuseRow {
  bom_import_id: string | null
  code: string | null
  reuse_count: number | null
  is_reused: boolean | null
}

export interface BomRolledUpLeafRow {
  bom_import_id: string | null
  code: string | null
  description: string | null
  material: string | null
  occurrence_count: number | null
  total_quantity: number | null
  unit_weight_kg: number | null
  total_weight_kg: number | null
}

export interface BomExtractionCandidateRow {
  bom_import_id: string | null
  version_group_id: string | null
  version_number: number | null
  lot_id: string | null
  representative_node_id: string | null
  article: string | null
  name: string | null
  name2: string | null
  designation: string | null
  material: string | null
  source_type: string | null
  drawing_number: string | null
  occurrence_count: number | null
  total_quantity: number | null
  unit_weight_kg: number | null
  total_weight_kg: number | null
  profile: string | null
  length_value: number | null
  width_value: number | null
  height_value: number | null
  requires_routing_assignment: boolean | null
  blockers: Json | null
  is_ready_for_production: boolean | null
}

export interface CreateBomImportPayload {
  p_file_name: string
  p_sheet_name: string
  p_header_row: number
  p_root_code: string
  p_parser_version: string
  p_project_id: string
  p_project_number_id: string
  p_lot_id: string
  p_source_file_path?: string
  p_source_file_name?: string
}

export interface AttachBomSourceFilePayload {
  p_bom_import_id: string
  p_object_path: string
  p_original_file_name: string
  p_mime_type: string
  p_size_bytes: number
  p_sha256: string
}

export interface CreateBomReimportPayload {
  p_previous_import_id: string
  p_file_name: string
  p_sheet_name: string
  p_header_row: number
  p_root_code: string
  p_parser_version: string
  p_source_file_name: string
}

export interface BomNodeBulkPayload {
  p_bom_import_id: string
  p_nodes: Json
}

export interface BomDeletePayload {
  p_bom_import_id: string
  p_confirmation: string
}

export interface BomDimensionMappingSavePayload {
  p_code: string
  p_description: string
  p_assignments: Json
}

export interface BomDimensionAssignmentPayload {
  token_index: number
  token_raw: string
  token_value: number | null
  role: BomDimensionRole
}

export interface BomImportListFilters {
  projectId?: string
  projectNumberId?: string
  lotId?: string
  search?: string
  status?: BomImportStatus
  versionState?: 'current' | 'superseded'
}
