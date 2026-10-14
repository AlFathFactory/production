import { supabase } from '../../../services/supabase/client'
import type { Database } from '../../../types/database'
import type { CreateBomRouteAssignmentOptionInput, UpdateBomRouteAssignmentOptionInput } from '../types'

type RouteOptionRow = Database['public']['Tables']['bom_route_assignment_options']['Row']

export const routeAssignmentOptionsApi = {
  async list(): Promise<RouteOptionRow[]> {
    const { data, error } = await supabase.from('bom_route_assignment_options').select('*').order('sort_order').order('label')
    if (error) throw error
    return data
  },
  async create(input: CreateBomRouteAssignmentOptionInput): Promise<RouteOptionRow> {
    const { data, error } = await supabase.from('bom_route_assignment_options').insert({ route: input.route, label: input.label.trim(), is_active: input.isActive, sort_order: input.sortOrder }).select().single()
    if (error) throw error
    return data
  },
  async update(id: string, input: UpdateBomRouteAssignmentOptionInput): Promise<RouteOptionRow> {
    const { data, error } = await supabase.from('bom_route_assignment_options').update({ label: input.label.trim(), is_active: input.isActive, sort_order: input.sortOrder }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('bom_route_assignment_options').delete().eq('id', id)
    if (error) throw error
  },
}
