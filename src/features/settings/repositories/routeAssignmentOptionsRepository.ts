import type { Database } from '../../../types/database'
import { routeAssignmentOptionsApi } from '../api/routeAssignmentOptionsApi'
import type { BomRouteAssignmentOption, CreateBomRouteAssignmentOptionInput, UpdateBomRouteAssignmentOptionInput } from '../types'

type Row = Database['public']['Tables']['bom_route_assignment_options']['Row']

function mapOption(row: Row): BomRouteAssignmentOption {
  return { id: row.id, route: row.route, label: row.label, isActive: row.is_active, sortOrder: row.sort_order, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) }
}

function message(error: unknown, action: string): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code === '23505') return 'That system route is already configured.'
  if (code === '42501') return 'You do not have permission to manage route assignment settings.'
  if (error instanceof TypeError) return 'Unable to reach Production Control. Check your connection and try again.'
  return `Unable to ${action}. Please try again.`
}

async function execute<T>(action: string, operation: () => Promise<T>): Promise<T> {
  try { return await operation() } catch (error) { throw new Error(message(error, action), { cause: error }) }
}

export const routeAssignmentOptionsRepository = {
  listRouteAssignmentOptions: () => execute('load route assignment settings', async () => (await routeAssignmentOptionsApi.list()).map(mapOption)),
  createRouteAssignmentOption: (input: CreateBomRouteAssignmentOptionInput) => execute('create the route option', async () => mapOption(await routeAssignmentOptionsApi.create(input))),
  updateRouteAssignmentOption: (id: string, input: UpdateBomRouteAssignmentOptionInput) => execute('update the route option', async () => mapOption(await routeAssignmentOptionsApi.update(id, input))),
  deleteRouteAssignmentOption: (id: string) => execute('delete the route option', () => routeAssignmentOptionsApi.delete(id)),
}
