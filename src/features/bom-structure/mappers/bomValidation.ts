import type { Json } from '../../../types/database'

export interface BomValidationIssue {
  kind: string
  message: string
  sourceRow: number | null
}

export interface BomValidationResult {
  isValid: boolean
  nodeCount: number
  rootCount: number
  errorCount: number
  warningCount: number
  errors: BomValidationIssue[]
  warnings: BomValidationIssue[]
}

export interface BomSaveResult {
  importId: string
  insertedCount: number
  warningCount: number
  status: string
}

function record(value: Json): { [key: string]: Json | undefined } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('The BOM server returned an unexpected response.')
  }
  return value
}

function issues(value: Json | undefined): BomValidationIssue[] {
  if (!Array.isArray(value)) throw new Error('The BOM server returned an invalid validation issue list.')
  return value.map((entry) => {
    const issue = record(entry)
    if (typeof issue.kind !== 'string' || typeof issue.message !== 'string') {
      throw new Error('The BOM server returned an invalid validation issue.')
    }
    return {
      kind: issue.kind,
      message: issue.message,
      sourceRow: typeof issue.source_row === 'number' ? issue.source_row : null,
    }
  })
}

export function mapBomValidation(value: Json): BomValidationResult {
  const result = record(value)
  if (typeof result.is_valid !== 'boolean'
    || typeof result.node_count !== 'number'
    || typeof result.root_count !== 'number'
    || typeof result.error_count !== 'number'
    || typeof result.warning_count !== 'number') {
    throw new Error('The BOM server returned an invalid validation result.')
  }
  return {
    isValid: result.is_valid,
    nodeCount: result.node_count,
    rootCount: result.root_count,
    errorCount: result.error_count,
    warningCount: result.warning_count,
    errors: issues(result.errors),
    warnings: issues(result.warnings),
  }
}

export function mapBomSaveResult(value: Json): BomSaveResult {
  const result = record(value)
  if (typeof result.bom_import_id !== 'string'
    || typeof result.inserted_count !== 'number'
    || typeof result.warning_count !== 'number'
    || result.status !== 'saved') {
    throw new Error('The BOM server returned an invalid save result. Check the import before retrying.')
  }
  return {
    importId: result.bom_import_id,
    insertedCount: result.inserted_count,
    warningCount: result.warning_count,
    status: result.status,
  }
}
