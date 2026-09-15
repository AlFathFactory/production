export type AppRole = 'admin' | 'supervisor' | 'operator'

export interface Database {
  public: {
    Tables: {
      app_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          employee_code: string
          full_name: string
          id: string
          is_active: boolean
          role: AppRole
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          employee_code: string
          full_name: string
          id?: string
          is_active?: boolean
          role?: AppRole
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          employee_code?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: AppRole
          updated_at?: string
        }
        Relationships: []
      }
      production_projects: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          notes: string | null
          project_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          project_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          project_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_project_numbers: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          project_id: string
          project_number: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          project_id: string
          project_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          project_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_lots: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lot_number: string
          notes: string | null
          project_number_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lot_number: string
          notes?: string | null
          project_number_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lot_number?: string
          notes?: string | null
          project_number_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      search_production_items: {
        Args: {
          p_last_activity_from?: string
          p_last_activity_to?: string
          p_lot_id?: string
          p_next_action?: string
          p_progress_state?: string
          p_project_id?: string
          p_project_number_id?: string
          p_query?: string
          p_route?: Database['public']['Enums']['production_route']
        }
        Returns: Array<{
          article: string | null
          available_action_quantity: number | null
          bend_total: number | null
          completion_percent: number | null
          cut_total: number | null
          designation: string | null
          dispensed_total: number | null
          last_activity_at: string | null
          lot_id: string | null
          lot_number: string | null
          material: string | null
          next_action: string | null
          out_bend_total: number | null
          production_item_id: string | null
          profile: string | null
          progress_state: string | null
          project_id: string | null
          project_name: string | null
          project_number: string | null
          project_number_id: string | null
          remaining_bend: number | null
          remaining_cut: number | null
          remaining_out_bend: number | null
          remaining_rolling: number | null
          remaining_to_dispense: number | null
          rolling_total: number | null
          routing: Database['public']['Enums']['production_route'] | null
          search_text: string | null
          total_quantity: number | null
          unit_weight_kg: number | null
          warehouse_stock: number | null
        }>
      }
    }
    Enums: {
      app_role: AppRole
      production_route: 'BEND' | 'NO BEND' | 'ROD' | 'ROLLING' | 'LADDER' | 'OTHER'
    }
    CompositeTypes: Record<string, never>
  }
}
