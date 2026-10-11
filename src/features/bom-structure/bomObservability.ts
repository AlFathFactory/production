/** Sanitized BOM diagnostics. Never emit filenames, workbook rows, RPC payloads, or server messages. */
export type BomErrorArea = 'parser' | 'upload' | 'rpc' | 'version-conflict'

export interface BomErrorEvent {
  area: BomErrorArea
  category: 'network' | 'permission' | 'version-conflict' | 'validation' | 'unknown'
  code: string | null
  at: string
}

export function reportBomError(area: BomErrorArea, error: unknown): BomErrorEvent {
  const source = typeof error === 'object' && error !== null ? error as Record<string, unknown> : {}
  const message = error instanceof Error ? error.message : typeof source.message === 'string' ? source.message : ''
  const code = typeof source.code === 'string' && ['42501', '23503', '23505', '23514', 'PGRST116'].includes(source.code) ? source.code : null
  const category: BomErrorEvent['category'] = area === 'version-conflict' || /version conflict|superseded|not current|already extracted/i.test(message)
    ? 'version-conflict'
    : code === '42501' || /permission denied|not authorized|authentication required/i.test(message)
      ? 'permission'
      : error instanceof TypeError || /network|fetch|offline/i.test(message)
        ? 'network'
        : /invalid|validation|mismatch/i.test(message)
          ? 'validation'
          : 'unknown'
  const event: BomErrorEvent = { area, category, code, at: new Date().toISOString() }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('bom:error', { detail: event }))
  console.error('[BOM]', event)
  return event
}
