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
      production_items: {
        Row: {
          article: string
          created_at: string
          created_by: string | null
          designation: string | null
          id: string
          is_active: boolean
          lot_id: string
          material: string | null
          profile: string | null
          remark: string | null
          routing: Database['public']['Enums']['production_route']
          source: Database['public']['Enums']['production_item_source']
          source_row: number | null
          total_quantity: number
          unit_weight_kg: number | null
          updated_at: string
        }
        Insert: {
          article: string
          created_at?: string
          created_by?: string | null
          designation?: string | null
          id?: string
          is_active?: boolean
          lot_id: string
          material?: string | null
          profile?: string | null
          remark?: string | null
          routing: Database['public']['Enums']['production_route']
          source?: Database['public']['Enums']['production_item_source']
          source_row?: number | null
          total_quantity: number
          unit_weight_kg?: number | null
          updated_at?: string
        }
        Update: {
          article?: string
          created_at?: string
          created_by?: string | null
          designation?: string | null
          id?: string
          is_active?: boolean
          lot_id?: string
          material?: string | null
          profile?: string | null
          remark?: string | null
          routing?: Database['public']['Enums']['production_route']
          source?: Database['public']['Enums']['production_item_source']
          source_row?: number | null
          total_quantity?: number
          unit_weight_kg?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      add_production_stage_entry: {
        Args: {
          p_entry_date?: string
          p_note?: string
          p_production_item_id: string
          p_quantity: number
          p_source?: string
          p_source_reference?: string
          p_stage: Database['public']['Enums']['production_stage']
        }
        Returns: {
          created_at: string
          created_by: string | null
          entry_date: string
          id: string
          note: string | null
          performed_by: string | null
          performed_by_name_snapshot: string | null
          production_item_id: string
          quantity: number
          source: string
          source_reference: string | null
          stage: Database['public']['Enums']['production_stage']
        }
      }
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
      production_item_source: 'excel_import' | 'manual'
      production_route: 'BEND' | 'NO BEND' | 'ROD' | 'ROLLING' | 'LADDER' | 'OTHER'
      production_stage: 'CUT' | 'OUT_BEND' | 'BEND' | 'ROLLING' | 'DISPENSE'
    }
    CompositeTypes: Record<string, never>
  }
}
