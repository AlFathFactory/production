import { BOM_PARSER_VERSION } from './bomSourceFile'
import type { BomImport } from './types/bomDomain.types'

type ReplaceImport = Pick<BomImport, 'id' | 'status' | 'parserVersion' | 'sourceFileBucket' | 'sourceFileName' | 'sourceFilePath'>

export function canReimportCurrentBom(importItem: ReplaceImport | null | undefined, currentSavedId: string | null, canManageImports: boolean): boolean {
  return Boolean(canManageImports && importItem?.status === 'saved' && importItem.id === currentSavedId)
}

export function canReplaceCurrentBom(importItem: ReplaceImport | null | undefined, currentSavedId: string | null, canManageImports: boolean): boolean {
  return canReimportCurrentBom(importItem, currentSavedId, canManageImports)
    && importItem?.parserVersion === BOM_PARSER_VERSION
    && importItem.sourceFileBucket === 'bom-imports'
    && Boolean(importItem.sourceFilePath && importItem.sourceFileName)
}

export async function downloadBomReplacementSource(
  importItem: ReplaceImport | null | undefined,
  currentSavedId: string | null,
  canManageImports: boolean,
  download: (path: string) => Promise<Blob>,
): Promise<Blob | null> {
  if (!canReplaceCurrentBom(importItem, currentSavedId, canManageImports) || !importItem?.sourceFilePath) return null
  return download(importItem.sourceFilePath)
}
