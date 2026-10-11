/** Versioned parsing and UI limits shared by the BOM feature. */
export const BOM_PARSER_VERSION = 'bom-parser-v1'
export const MAX_BOM_FILE_SIZE_BYTES = 25 * 1024 * 1024
export const BOM_SOURCE_MIME_TYPES = {
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const
export const BOM_ALLOWED_EXTENSIONS = Object.keys(BOM_SOURCE_MIME_TYPES) as Array<keyof typeof BOM_SOURCE_MIME_TYPES>
export const BOM_IMPORTS_STALE_TIME_MS = 30_000
export const BOM_DIMENSION_MAPPING_STALE_TIME_MS = 30_000
export const BOM_TREE_RENDER_STEP = 400
