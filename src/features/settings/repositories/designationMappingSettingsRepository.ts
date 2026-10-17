import { bomApi } from '../../bom-structure/api/bomApi'
import { mapBomDesignationMapping, mapBomDesignationType } from '../../bom-structure/mappers/bomMapper'
import type { DesignationMappingInput, DesignationTypeInput } from '../types'

function message(error: unknown, action: string): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code === '23505') return 'That designation type or code already exists.'
  if (code === '23503') return 'This type is currently used by one or more designation mappings. Remove or change those mappings first.'
  if (code === '42501') return 'You do not have permission to manage Excel mapping settings.'
  if (error instanceof TypeError) return 'Unable to reach Production Control. Check your connection and try again.'
  return `Unable to ${action}. Please try again.`
}

async function execute<T>(action: string, operation: () => Promise<T>): Promise<T> {
  try { return await operation() } catch (error) { throw new Error(message(error, action), { cause: error }) }
}

export const designationMappingSettingsRepository = {
  listTypes: () => execute('load designation types', async () => (await bomApi.listDesignationTypes()).map(mapBomDesignationType)),
  createType: (input: DesignationTypeInput) => execute('create the designation type', async () => mapBomDesignationType(await bomApi.createDesignationType(input))),
  updateType: (id: string, input: DesignationTypeInput) => execute('update the designation type', async () => mapBomDesignationType(await bomApi.updateDesignationType(id, input))),
  deleteType: (id: string) => execute('delete the designation type', () => bomApi.deleteDesignationType(id)),
  listMappings: () => execute('load designation code mappings', async () => (await bomApi.listDesignationMappings()).map(mapBomDesignationMapping)),
  createMapping: (input: DesignationMappingInput) => execute('create the designation code mapping', async () => mapBomDesignationMapping(await bomApi.createDesignationMappingRecord(input))),
  updateMapping: (id: string, input: DesignationMappingInput) => execute('update the designation code mapping', async () => mapBomDesignationMapping(await bomApi.updateDesignationMappingRecord(id, input))),
  deleteMapping: (id: string) => execute('delete the designation code mapping', () => bomApi.deleteDesignationMapping(id)),
}
