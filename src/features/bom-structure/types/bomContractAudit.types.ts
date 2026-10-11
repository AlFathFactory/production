import type { Database } from '../../../types/database'
import type {
  AttachBomSourceFilePayload, BomDeletePayload, BomDimensionMappingLookupRow,
  BomDimensionMappingSavePayload, BomDimensionMappingRow, BomExtractionCandidateRow,
  BomExtractionExecutePayload, BomImportRow, BomNodeBulkPayload, BomNodeRow,
  BomTreeNodeRow, CreateBomImportPayload, CreateBomReimportPayload,
} from './bomBackend.types'

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false
type Assert<T extends true> = T
type Public = Database['public']
type Args<Name extends keyof Public['Functions']> = Public['Functions'][Name]['Args']
type Returns<Name extends keyof Public['Functions']> = Public['Functions'][Name]['Returns']

/** Build-time tripwires for DTO/RPC/table/view drift; live schema is reviewed separately. */
export type BomContractAudit = [
  Assert<Equal<CreateBomImportPayload, Args<'create_bom_import'>>>,
  Assert<Equal<CreateBomReimportPayload, Args<'create_bom_reimport'>>>,
  Assert<Equal<AttachBomSourceFilePayload, Args<'attach_bom_import_source_file'>>>,
  Assert<Equal<BomNodeBulkPayload, Args<'insert_bom_nodes_bulk'>>>,
  Assert<Equal<BomNodeBulkPayload, Args<'replace_bom_import_nodes'>>>,
  Assert<Equal<BomDeletePayload, Args<'delete_bom_import'>>>,
  Assert<Equal<BomDimensionMappingSavePayload, Args<'save_bom_dimension_mapping'>>>,
  Assert<Equal<BomExtractionExecutePayload, Args<'extract_bom_to_production'>>>,
  Assert<Equal<Omit<BomImportRow, 'status'>, Omit<Public['Tables']['bom_imports']['Row'], 'status'>>>,
  Assert<Equal<BomNodeRow, Pick<Public['Tables']['bom_nodes']['Row'], keyof BomNodeRow>>>,
  Assert<Equal<Omit<BomDimensionMappingRow, 'role'>, Omit<Public['Tables']['bom_dimension_mappings']['Row'], 'role'>>>,
  Assert<Equal<BomTreeNodeRow, Returns<'get_bom_tree'>[number]>>,
  Assert<Equal<BomNodeRow, Returns<'get_bom_node_details'>[number]>>,
  Assert<Equal<Omit<BomDimensionMappingLookupRow, 'role'>, Omit<Returns<'get_bom_dimension_mapping'>[number], 'role'>>>,
  Assert<Equal<BomExtractionCandidateRow, Public['Views']['bom_production_extraction_candidates']['Row']>>,
]
