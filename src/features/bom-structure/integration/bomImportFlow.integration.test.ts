import { beforeEach, describe, expect, test, vi } from 'vitest'

import { bomRepository, BomRepositoryError } from '../repositories/bomRepository'
import type { BomImportRow } from '../types/bomBackend.types'

const api = vi.hoisted(() => ({
  attachSourceFile: vi.fn(),
  createImport: vi.fn(),
  createReimport: vi.fn(),
  deleteImport: vi.fn(),
  extractToProduction: vi.fn(),
  getDimensionMapping: vi.fn(),
  getExtractionPreview: vi.fn(),
  getExtractionStatus: vi.fn(),
  saveDimensionMapping: vi.fn(),
  saveNodes: vi.fn(),
  uploadSourceFile: vi.fn(),
  validateNodes: vi.fn(),
}))

vi.mock('../api/bomApi', () => ({ bomApi: api }))

function importRow(overrides: Partial<BomImportRow> = {}): BomImportRow {
  return {
    activated_at: null,
    created_at: '2026-10-10T10:00:00Z',
    created_by: 'user-1',
    file_name: 'bom.xlsx',
    header_row: 4,
    id: 'import-1',
    lot_id: 'lot-1',
    parser_version: 'bom-parser-v1',
    project_id: 'project-1',
    project_number_id: 'number-1',
    root_code: 'ROOT',
    sheet_name: 'Sheet1',
    source_file_bucket: 'bom-imports',
    source_file_mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    source_file_name: 'bom.xlsx',
    source_file_path: 'import-1/bom.xlsx',
    source_file_sha256: 'sha256-abc',
    source_file_size_bytes: 1024,
    source_file_uploaded_at: '2026-10-10T10:01:00Z',
    status: 'parsed',
    superseded_by_import_id: null,
    supersedes_import_id: null,
    updated_at: '2026-10-10T10:01:00Z',
    updated_by: null,
    version_group_id: 'group-1',
    version_number: 1,
    ...overrides,
  }
}

function validationJson() {
  return {
    error_count: 0,
    errors: [],
    is_valid: true,
    node_count: 3,
    root_count: 1,
    warning_count: 0,
    warnings: [],
  }
}

function saveResultJson() {
  return { bom_import_id: 'import-1', inserted_count: 3, status: 'saved', warning_count: 0 }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('BOM import flow (repository integration, no live backend)', () => {
  test('create → upload → attach → validate → save runs in order with mapped arguments', async () => {
    api.createImport.mockResolvedValue(importRow())
    api.uploadSourceFile.mockResolvedValue({ path: 'import-1/bom.xlsx' })
    api.attachSourceFile.mockResolvedValue(importRow({ status: 'parsed' }))
    api.validateNodes.mockResolvedValue(validationJson())
    api.saveNodes.mockResolvedValue(saveResultJson())

    const created = await bomRepository.createImport({
      p_file_name: 'bom.xlsx',
      p_header_row: 4,
      p_lot_id: 'lot-1',
      p_parser_version: 'bom-parser-v1',
      p_project_id: 'project-1',
      p_project_number_id: 'number-1',
      p_root_code: 'ROOT',
      p_sheet_name: 'Sheet1',
    })
    expect(created.id).toBe('import-1')
    expect(created.status).toBe('parsed')

    const file = new File(['workbook'], 'bom.xlsx')
    await bomRepository.uploadSourceFile('import-1/bom.xlsx', file)
    expect(api.uploadSourceFile).toHaveBeenCalledWith('import-1/bom.xlsx', file)

    const attached = await bomRepository.attachSourceFile({
      p_bom_import_id: 'import-1',
      p_mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      p_object_path: 'import-1/bom.xlsx',
      p_original_file_name: 'bom.xlsx',
      p_sha256: 'sha256-abc',
      p_size_bytes: 1024,
    })
    expect(attached.sourceFileSha256).toBe('sha256-abc')

    const nodes = [{ source_row: 5 }, { source_row: 6 }, { source_row: 7 }]
    const validation = await bomRepository.validateNodes(nodes as never)
    expect(validation.isValid).toBe(true)
    expect(validation.nodeCount).toBe(3)

    // Validated-payload identity: save must persist exactly what was validated.
    const saved = await bomRepository.saveNodes({ p_bom_import_id: 'import-1', p_nodes: nodes as never })
    expect(api.saveNodes.mock.calls[0]?.[0].p_nodes).toBe(nodes)
    expect(saved.insertedCount).toBe(3)

    const order = [
      'createImport',
      'uploadSourceFile',
      'attachSourceFile',
      'validateNodes',
      'saveNodes',
    ].map((name) => (api[name as keyof typeof api] as { mock: { invocationCallOrder: number[] } }).mock.invocationCallOrder[0])
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  test('invalid save payloads fail closed with reopen guidance', async () => {
    api.saveNodes.mockResolvedValue({ bom_import_id: 'import-1', inserted_count: 3, warning_count: 0 })
    await expect(bomRepository.saveNodes({ p_bom_import_id: 'import-1', p_nodes: null as never }))
      .rejects.toThrow(/check the import before retrying/i)
  })

  test('re-import creates a new version linked to the previous import', async () => {
    api.createReimport.mockResolvedValue(importRow({ id: 'import-2', status: 'parsed', version_number: 2 }))
    const next = await bomRepository.createReimport({
      p_file_name: 'bom-v2.xlsx',
      p_header_row: 4,
      p_previous_import_id: 'import-1',
      p_parser_version: 'bom-parser-v1',
      p_root_code: 'ROOT',
      p_sheet_name: 'Sheet1',
      p_source_file_name: 'bom-v2.xlsx',
    })
    expect(next.id).toBe('import-2')
    expect(next.versionNumber).toBe(2)
    expect(api.createReimport).toHaveBeenCalledWith(expect.objectContaining({ p_previous_import_id: 'import-1' }))
  })

  test('dimension mapping lookup, save, and invalid-save rejection', async () => {
    api.getDimensionMapping.mockResolvedValue([
      {
        code: 'AKT',
        created_at: '2026-10-10T10:00:00Z',
        description: 'AKT L 5/90',
        id: 'mapping-1',
        match_scope: 'code',
        role: 'length',
        token_index: 1,
        token_raw: '5',
        token_value: 5,
        updated_at: '2026-10-10T10:00:00Z',
      },
    ])
    const rows = await bomRepository.getDimensionMapping('AKT', 'AKT L 5/90')
    expect(rows).toHaveLength(1)
    expect(rows[0]?.role).toBe('length')

    api.saveDimensionMapping.mockResolvedValue({ code: 'AKT', description: 'AKT L 5/90', saved_count: 4, status: 'saved' })
    const saved = await bomRepository.saveDimensionMapping({ p_assignments: [] as never, p_code: 'AKT', p_description: 'AKT L 5/90' })
    expect(saved.savedCount).toBe(4)

    api.saveDimensionMapping.mockResolvedValue({ unexpected: true })
    await expect(bomRepository.saveDimensionMapping({ p_assignments: [] as never, p_code: 'AKT', p_description: 'AKT L 5/90' }))
      .rejects.toThrow(/reopen the mapping/i)
  })

  test('admin delete succeeds while supervisor rejection maps to a permission error', async () => {
    api.deleteImport.mockResolvedValue({ deleted: true })
    await bomRepository.deleteImport({ p_bom_import_id: 'import-1', p_confirmation: 'DELETE' })
    expect(api.deleteImport).toHaveBeenCalledWith({ p_bom_import_id: 'import-1', p_confirmation: 'DELETE' })

    api.deleteImport.mockRejectedValue({ code: '42501', message: 'permission denied for table bom_imports' })
    const failure = await bomRepository.deleteImport({ p_bom_import_id: 'import-2', p_confirmation: 'DELETE' }).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(BomRepositoryError)
    expect((failure as Error).message).toMatch(/permission to manage bom imports/i)
  })

  test('extraction preview → execute → status with ledger mapping', async () => {
    api.getExtractionPreview.mockResolvedValue([
      {
        article: 'A-1',
        blockers: ['routing-assignment-required'],
        bom_import_id: 'import-1',
        designation: 'Part A-1',
        drawing_number: null,
        height_value: null,
        is_ready_for_production: false,
        length_value: null,
        lot_id: 'lot-1',
        material: 'S235',
        name: 'Part A-1',
        name2: null,
        occurrence_count: 2,
        profile: null,
        representative_node_id: 'node-1',
        requires_routing_assignment: true,
        source_type: 'Eigenfertigung',
        total_quantity: 8,
        total_weight_kg: 24,
        unit_weight_kg: 3,
        version_group_id: 'group-1',
        version_number: 1,
        width_value: null,
      },
    ])
    const preview = await bomRepository.getExtractionPreview('import-1')
    expect(preview).toHaveLength(1)
    expect(preview[0]?.requiresRoutingAssignment).toBe(true)

    const requestId = 'request-integration-1'
    api.extractToProduction.mockResolvedValue({
      already_extracted: false,
      bom_import_id: 'import-1',
      candidate_count: 1,
      created_at: '2026-10-10T11:00:00Z',
      created_count: 1,
      extraction_id: 'extraction-1',
      lot_id: 'lot-1',
      request_id: requestId,
      skipped_count: 0,
      version_number: 1,
    })
    const result = await bomRepository.extractToProduction({
      p_assignments: { 'A-1': 'BEND' } as never,
      p_bom_import_id: 'import-1',
      p_request_id: requestId,
    })
    expect(result.extractionId).toBe('extraction-1')
    expect(result.alreadyExtracted).toBe(false)

    // Same-request retry returns the prior ledger result instead of writing again.
    api.extractToProduction.mockResolvedValue({
      already_extracted: true,
      bom_import_id: 'import-1',
      candidate_count: 1,
      created_at: '2026-10-10T11:00:00Z',
      created_count: 1,
      extraction_id: 'extraction-1',
      lot_id: 'lot-1',
      request_id: requestId,
      skipped_count: 0,
      version_number: 1,
    })
    const retry = await bomRepository.extractToProduction({
      p_assignments: { 'A-1': 'BEND' } as never,
      p_bom_import_id: 'import-1',
      p_request_id: requestId,
    })
    expect(retry.alreadyExtracted).toBe(true)
    expect(api.extractToProduction).toHaveBeenCalledTimes(2)
    expect(api.extractToProduction.mock.calls[1]?.[0].p_request_id).toBe(requestId)

    api.getExtractionStatus.mockResolvedValue({
      already_extracted: true,
      bom_import_id: 'import-1',
      candidate_count: 1,
      created_at: '2026-10-10T11:00:00Z',
      created_count: 1,
      extraction_id: 'extraction-1',
      lot_id: 'lot-1',
      request_id: requestId,
      skipped_count: 0,
      version_number: 1,
    })
    const status = await bomRepository.getExtractionStatus('import-1')
    expect(status?.extractionId).toBe('extraction-1')

    api.getExtractionStatus.mockResolvedValue(null)
    await expect(bomRepository.getExtractionStatus('import-1')).resolves.toBeNull()
  })

  test('extraction contract rejections surface the server reason verbatim', async () => {
    api.extractToProduction.mockRejectedValue({
      message: 'An article already exists in this Production lot; extraction was not started',
    })
    const failure = await bomRepository.extractToProduction({
      p_assignments: { 'A-1': 'BEND' } as never,
      p_bom_import_id: 'import-1',
      p_request_id: 'request-conflict-1',
    }).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(BomRepositoryError)
    expect((failure as Error).message).toMatch(/already exists in this production lot/i)
  })

  test('network failures map to a retryable connection message', async () => {
    api.saveNodes.mockRejectedValue(new TypeError('fetch failed'))
    const failure = await bomRepository.saveNodes({ p_bom_import_id: 'import-1', p_nodes: [] as never }).catch((error: unknown) => error)
    expect((failure as Error).message).toMatch(/check your connection/i)
  })
})
