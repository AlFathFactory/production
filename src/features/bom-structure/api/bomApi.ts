import { supabase } from '../../../services/supabase/client'
import type { Database, Json } from '../../../types/database'
import { getBomSourceMimeType } from '../bomSourceFile'
import type {
  AttachBomSourceFilePayload,
  BomDeletePayload,
  BomDimensionMappingLookupRow,
  BomDimensionMappingSavePayload,
  BomDimensionRole,
  BomExtractionCandidateRow,
  BomImportListFilters,
  BomImportRow,
  BomNodeBulkPayload,
  BomNodeRow,
  BomReuseRow,
  BomRolledUpLeafRow,
  BomSummaryRow,
  BomTreeNodeRow,
  BomWarningRow,
  CreateBomImportPayload,
  CreateBomReimportPayload,
} from '../types/bomBackend.types'

const BOM_SOURCE_BUCKET = 'bom-imports'
type DatabaseBomImport = Database['public']['Tables']['bom_imports']['Row']

function toImportStatus(status: string): BomImportRow['status'] {
  if (status === 'parsed' || status === 'saved' || status === 'failed' || status === 'superseded') return status
  throw new Error(`The server returned an unsupported BOM import status: ${status}`)
}

function toBomImportRow(row: DatabaseBomImport): BomImportRow {
  return { ...row, status: toImportStatus(row.status) }
}

function toDimensionRole(role: string): BomDimensionRole {
  if (role === 'profile' || role === 'length' || role === 'width' || role === 'height' || role === 'unassigned') return role
  throw new Error(`The server returned an unsupported BOM dimension role: ${role}`)
}

export const bomApi = {
  async listImports(filters: BomImportListFilters): Promise<BomImportRow[]> {
    let query = supabase.from('bom_imports').select('*').order('created_at', { ascending: false }).limit(250)

    if (filters.projectId) query = query.eq('project_id', filters.projectId)
    if (filters.projectNumberId) query = query.eq('project_number_id', filters.projectNumberId)
    if (filters.lotId) query = query.eq('lot_id', filters.lotId)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.versionState === 'current') query = query.eq('status', 'saved')
    if (filters.versionState === 'superseded') query = query.eq('status', 'superseded')
    if (filters.search?.trim()) {
      const search = filters.search.trim().replaceAll(',', ' ')
      query = query.or(`file_name.ilike.%${search}%,root_code.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data.map(toBomImportRow)
  },

  async createImport(payload: CreateBomImportPayload): Promise<BomImportRow> {
    const { data, error } = await supabase.rpc('create_bom_import', payload)
    if (error) throw error
    return toBomImportRow(data)
  },

  async getImport(importId: string): Promise<BomImportRow | null> {
    const { data, error } = await supabase.from('bom_imports').select('*').eq('id', importId).maybeSingle()
    if (error) throw error
    return data ? toBomImportRow(data) : null
  },

  async uploadSourceFile(objectPath: string, file: File): Promise<{ path: string }> {
    const contentType = getBomSourceMimeType(file)
    const { data, error } = await supabase.storage.from(BOM_SOURCE_BUCKET).upload(objectPath, file, {
      contentType,
      upsert: false,
    })
    if (error) throw error
    return { path: data.path }
  },

  async attachSourceFile(payload: AttachBomSourceFilePayload): Promise<BomImportRow> {
    const { data, error } = await supabase.rpc('attach_bom_import_source_file', payload)
    if (error) throw error
    return toBomImportRow(data)
  },

  async saveNodes(payload: BomNodeBulkPayload): Promise<Json> {
    const { data, error } = await supabase.rpc('insert_bom_nodes_bulk', payload)
    if (error) throw error
    return data
  },

  async replaceNodes(payload: BomNodeBulkPayload): Promise<Json> {
    const { data, error } = await supabase.rpc('replace_bom_import_nodes', payload)
    if (error) throw error
    return data
  },

  async validateNodes(nodes: Json): Promise<Json> {
    const { data, error } = await supabase.rpc('validate_bom_import_nodes', { p_nodes: nodes })
    if (error) throw error
    return data
  },

  async createReimport(payload: CreateBomReimportPayload): Promise<BomImportRow> {
    const { data, error } = await supabase.rpc('create_bom_reimport', payload)
    if (error) throw error
    return toBomImportRow(data)
  },

  async deleteImport(payload: BomDeletePayload): Promise<Json> {
    const { data, error } = await supabase.rpc('delete_bom_import', payload)
    if (error) throw error
    return data
  },

  async getTree(importId: string): Promise<BomTreeNodeRow[]> {
    const rows: BomTreeNodeRow[] = []
    for (let start = 0; ; start += 1000) {
      const { data, error } = await supabase.rpc('get_bom_tree', { p_bom_import_id: importId }).order('source_row').range(start, start + 999)
      if (error) throw error
      rows.push(...data)
      if (data.length < 1000) return rows
    }
  },

  async getNodeDetails(nodeId: string): Promise<BomNodeRow | null> {
    const { data, error } = await supabase.rpc('get_bom_node_details', { p_node_id: nodeId })
    if (error) throw error
    return data[0] ?? null
  },

  async getWarnings(importId: string): Promise<BomWarningRow[]> {
    const rows: BomWarningRow[] = []
    for (let start = 0; ; start += 1000) {
      const { data, error } = await supabase.from('bom_import_warnings').select('*')
        .eq('bom_import_id', importId).order('warning_index').range(start, start + 999)
      if (error) throw error
      rows.push(...data)
      if (data.length < 1000) return rows
    }
  },

  async getSummary(importId: string): Promise<BomSummaryRow | null> {
    const { data, error } = await supabase.from('bom_summary').select('*').eq('bom_import_id', importId).maybeSingle()
    if (error) throw error
    return data
  },

  async getReuseCounts(importId: string): Promise<BomReuseRow[]> {
    const rows: BomReuseRow[] = []
    for (let start = 0; ; start += 1000) {
      const { data, error } = await supabase.from('bom_reuse_counts').select('*')
        .eq('bom_import_id', importId).order('code').range(start, start + 999)
      if (error) throw error
      rows.push(...data)
      if (data.length < 1000) return rows
    }
  },

  async getRolledUpParts(importId: string): Promise<BomRolledUpLeafRow[]> {
    const rows: BomRolledUpLeafRow[] = []
    for (let start = 0; ; start += 1000) {
      const { data, error } = await supabase.from('bom_rolled_up_leaf_parts').select('*')
        .eq('bom_import_id', importId).order('code').order('description').order('material').range(start, start + 999)
      if (error) throw error
      rows.push(...data)
      if (data.length < 1000) return rows
    }
  },

  async getDimensionMapping(code: string, description: string): Promise<BomDimensionMappingLookupRow[]> {
    const { data, error } = await supabase.rpc('get_bom_dimension_mapping', {
      p_code: code,
      p_description: description,
    })
    if (error) throw error
    return data.map((row) => ({
      ...row,
      code: row.code,
      token_value: row.token_value,
      role: toDimensionRole(row.role),
    }))
  },

  async saveDimensionMapping(payload: BomDimensionMappingSavePayload): Promise<Json> {
    const { data, error } = await supabase.rpc('save_bom_dimension_mapping', payload)
    if (error) throw error
    return data
  },

  async getExtractionPreview(importId: string): Promise<BomExtractionCandidateRow[]> {
    const { data, error } = await supabase.rpc('get_bom_production_extraction_preview', { p_bom_import_id: importId })
    if (error) throw error
    return data
  },
}
