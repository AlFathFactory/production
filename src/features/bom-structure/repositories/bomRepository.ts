import type { Json } from '../../../types/database'
import { bomApi } from '../api/bomApi'
import { reportBomError } from '../bomObservability'
import { mapBomSaveResult, mapBomValidation } from '../mappers/bomValidation'
import {
  mapBomDimensionMapping,
  mapBomDimensionSaveResult,
  mapBomDesignationMapping,
  mapBomDesignationType,
  mapBomExtractionCandidate,
  mapBomExtractionResult,
  mapBomExtractionStatus,
  mapBomImport,
  mapBomNode,
  mapBomReuseCount,
  mapBomSummary,
  mapBomTree,
  mapBomWarning,
  mapRolledUpBomPart,
} from '../mappers/bomMapper'
import type {
  AttachBomSourceFilePayload,
  BomDeletePayload,
  BomDimensionMappingSavePayload,
  BomExtractionExecutePayload,
  BomImportListFilters,
  BomNodeBulkPayload,
  CreateBomImportPayload,
  CreateBomReimportPayload,
} from '../types/bomBackend.types'

export class BomRepositoryError extends Error {
  constructor(message: string, readonly cause: unknown) {
    super(message)
    this.name = 'BomRepositoryError'
  }
}

function messageFor(error: unknown, action: string): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  const message = error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''
  if (error instanceof Error && (/^The BOM server returned|^The server returned|^The extraction result/.test(message))) {
    // Mapper-authored shape diagnostics already carry recovery guidance
    // (reopen/retry wording); keep them verbatim instead of collapsing them.
    return message
  }
  if (code === '42501' || /Only active admins or supervisors|Authentication required|permission denied/i.test(message)) {
    return 'You do not have permission to manage BOM imports.'
  }
  if (error instanceof TypeError || (error instanceof Error && /fetch|network|offline/i.test(error.message))) {
    return 'Unable to reach Production Control. Check your connection and try again.'
  }
  return `Unable to ${action}. Please try again.`
}

async function execute<T>(action: string, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    reportBomError(action === 'upload the source workbook' ? 'upload' : /version|re-import|replace/i.test(action) ? 'version-conflict' : 'rpc', error)
    throw new BomRepositoryError(messageFor(error, action), error)
  }
}

function serverMessage(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('message' in error)) return null
  const message = String(error.message).trim()
  return message ? message : null
}

async function executeExtraction<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    reportBomError('rpc', error)
    // Extraction rejections carry the approved contract reason (duplicate
    // article, unresolved blocker, already extracted, version conflict).
    // Surface the server message so the conflict is actionable instead of
    // collapsing it into a generic failure.
    const message = serverMessage(error)
    if (message && /Only active admins or supervisors|Authentication required|permission denied|42501/i.test(message)) {
      throw new BomRepositoryError('You do not have permission to extract BOM to Production.', error)
    }
    if (message && message.length <= 280) {
      throw new BomRepositoryError(message, error)
    }
    throw new BomRepositoryError(messageFor(error, 'extract BOM to Production'), error)
  }
}

export const bomRepository = {
  listImports: (filters: BomImportListFilters = {}) => execute('load BOM imports', async () => (await bomApi.listImports(filters)).map(mapBomImport)),
  getImport: (importId: string) => execute('load the BOM import', async () => {
    const row = await bomApi.getImport(importId)
    return row ? mapBomImport(row) : null
  }),
  listVersions: (groupId: string) => execute('load BOM version history', async () => {
    const rows = await bomApi.listVersions(groupId)
    // Profile lookup is supplementary; keep the version history usable if it is not permitted.
    const userIds = [...new Set(rows.flatMap((row) => [row.created_by, row.updated_by].filter((id): id is string => Boolean(id))))]
    const names = await bomApi.getCreatorNames(userIds).catch(() => ({} as Record<string, string>))
    return rows.map((row) => ({ ...mapBomImport(row), createdByName: names[row.created_by] ?? null, updatedByName: row.updated_by ? names[row.updated_by] ?? null : null }))
  }),
  getCurrentSavedVersionId: (groupId: string) => execute('resolve the current saved BOM version', () => bomApi.getCurrentSavedVersionId(groupId)),
  createImport: (payload: CreateBomImportPayload) => execute('create the BOM import', async () => mapBomImport(await bomApi.createImport(payload))),
  uploadSourceFile: (objectPath: string, file: File) => execute('upload the source workbook', () => bomApi.uploadSourceFile(objectPath, file)),
  downloadSourceFile: (objectPath: string) => execute('download the original workbook', () => bomApi.downloadSourceFile(objectPath)),
  attachSourceFile: (payload: AttachBomSourceFilePayload) => execute('attach the source workbook', async () => mapBomImport(await bomApi.attachSourceFile(payload))),
  saveNodes: (payload: BomNodeBulkPayload) => execute('save BOM nodes', async () => mapBomSaveResult(await bomApi.saveNodes(payload))),
  replaceNodes: (payload: BomNodeBulkPayload) => execute('replace BOM nodes', async () => mapBomSaveResult(await bomApi.replaceNodes(payload))),
  createReimport: (payload: CreateBomReimportPayload) => execute('create the re-import', async () => mapBomImport(await bomApi.createReimport(payload))),
  deleteImport: (payload: BomDeletePayload) => execute('delete the BOM import', () => bomApi.deleteImport(payload)),
  getTree: (importId: string) => execute('load the BOM tree', async () => {
    const [rows, reuseRows] = await Promise.all([bomApi.getTree(importId), bomApi.getReuseCounts(importId)])
    return mapBomTree(rows, reuseRows)
  }),
  getNodeDetails: (nodeId: string) => execute('load BOM node details', async () => {
    const row = await bomApi.getNodeDetails(nodeId)
    return row ? mapBomNode(row) : null
  }),
  getWarnings: (importId: string) => execute('load BOM warnings', async () => (await bomApi.getWarnings(importId)).map(mapBomWarning)),
  getSummary: (importId: string) => execute('load the BOM summary', async () => {
    const row = await bomApi.getSummary(importId)
    return row ? mapBomSummary(row) : null
  }),
  getReuseCounts: (importId: string) => execute('load BOM reuse counts', async () => (await bomApi.getReuseCounts(importId)).map(mapBomReuseCount)),
  getRolledUpParts: (importId: string) => execute('load rolled-up BOM parts', async () => (await bomApi.getRolledUpParts(importId)).map(mapRolledUpBomPart)),
  getDimensionMapping: (code: string, description: string) => execute('load dimension mappings', async () => (await bomApi.getDimensionMapping(code, description)).map(mapBomDimensionMapping)),
  saveDimensionMapping: (payload: BomDimensionMappingSavePayload) => execute('save dimension mappings', async () => mapBomDimensionSaveResult(await bomApi.saveDimensionMapping(payload))),
  getActiveDesignationTypes: () => execute('load active designation types', async () => (await bomApi.getActiveDesignationTypes()).map(mapBomDesignationType)),
  getActiveDesignationMappings: () => execute('load active designation mappings', async () => (await bomApi.getActiveDesignationMappings()).map(mapBomDesignationMapping)),
  createDesignationMapping: (code: string, typeId: string) => execute('save designation mapping', async () => mapBomDesignationMapping(await bomApi.createActiveDesignationMapping(code, typeId))),
  updateDesignationMapping: (mappingId: string, typeId: string) => execute('update designation mapping', async () => mapBomDesignationMapping(await bomApi.updateDesignationMappingType(mappingId, typeId))),
  getExtractionPreview: (importId: string) => execute('load the extraction preview', async () => (await bomApi.getExtractionPreview(importId)).map(mapBomExtractionCandidate)),
  getExtractionStatus: (importId: string) => execute('load the Production extraction status', async () => mapBomExtractionStatus(await bomApi.getExtractionStatus(importId), importId)),
  extractToProduction: (payload: BomExtractionExecutePayload) => executeExtraction(async () => mapBomExtractionResult(await bomApi.extractToProduction(payload), payload.p_bom_import_id)),
  validateNodes: (nodes: Json) => execute('validate BOM nodes', async () => mapBomValidation(await bomApi.validateNodes(nodes))),
}
