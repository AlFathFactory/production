import type { BomImportListFilters } from '../types/bomBackend.types'

export const bomKeys = {
  all: ['bom'] as const,
  imports: (filters: BomImportListFilters = {}) => ['bom', 'imports', filters] as const,
  import: (id: string) => ['bom', 'import', id] as const,
  tree: (id: string) => ['bom', 'tree', id] as const,
  details: (id: string) => ['bom', 'details', id] as const,
  summary: (id: string) => ['bom', 'summary', id] as const,
  warnings: (id: string) => ['bom', 'warnings', id] as const,
  reuse: (id: string) => ['bom', 'reuse', id] as const,
  rollups: (id: string) => ['bom', 'rollups', id] as const,
  dimensionMapping: (code: string, description: string) => ['bom', 'dimension-mapping', code.trim().toLocaleLowerCase(), description.trim()] as const,
  versions: (groupId: string) => ['bom', 'versions', groupId] as const,
  extraction: (id: string) => ['bom', 'extraction', id] as const,
}
