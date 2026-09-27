export type AppRole = 'admin' | 'supervisor' | 'operator'
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      production_stage_entries: {
        Row: {
          id: string
          production_item_id: string
          stage: Database['public']['Enums']['production_stage']
          quantity: number
          entry_date: string
          note: string | null
          source: string
          source_reference: string | null
          created_at: string
          created_by: string | null
          performed_by: string | null
          performed_by_name_snapshot: string | null
        }
        Insert: {
          id?: string
          production_item_id: string
          stage: Database['public']['Enums']['production_stage']
          quantity: number
          entry_date?: string
          note?: string | null
          source?: string
          source_reference?: string | null
          created_at?: string
          created_by?: string | null
          performed_by?: string | null
          performed_by_name_snapshot?: string | null
        }
        Update: {
          id?: string
          production_item_id?: string
          stage?: Database['public']['Enums']['production_stage']
          quantity?: number
          entry_date?: string
          note?: string | null
          source?: string
          source_reference?: string | null
          created_at?: string
          created_by?: string | null
          performed_by?: string | null
          performed_by_name_snapshot?: string | null
        }
        Relationships: []
      },
      bending_dispatches: {
        Row: {
          approval_name: string | null
          created_at: string
          created_by: string | null
          destination: string | null
          dispatch_date: string
          dispatch_name: string | null
          dispatch_number: string
          follow_name: string | null
          id: string
          lot_id: string
          pdf_path: string | null
          sheet_number: string | null
        }
        Insert: {
          approval_name?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string | null
          dispatch_date?: string
          dispatch_name?: string | null
          dispatch_number: string
          follow_name?: string | null
          id?: string
          lot_id: string
          pdf_path?: string | null
          sheet_number?: string | null
        }
        Update: {
          approval_name?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string | null
          dispatch_date?: string
          dispatch_name?: string | null
          dispatch_number?: string
          follow_name?: string | null
          id?: string
          lot_id?: string
          pdf_path?: string | null
          sheet_number?: string | null
        }
        Relationships: []
      }
      bending_dispatch_items: {
        Row: {
          created_at: string
          designation_snapshot: string | null
          dispatch_id: string
          id: string
          production_item_id: string
          profile_snapshot: string | null
          quantity: number
          remark_snapshot: string | null
          stage_entry_id: string
          unit_weight_kg_snapshot: number | null
        }
        Insert: {
          created_at?: string
          designation_snapshot?: string | null
          dispatch_id: string
          id?: string
          production_item_id: string
          profile_snapshot?: string | null
          quantity: number
          remark_snapshot?: string | null
          stage_entry_id: string
          unit_weight_kg_snapshot?: number | null
        }
        Update: {
          created_at?: string
          designation_snapshot?: string | null
          dispatch_id?: string
          id?: string
          production_item_id?: string
          profile_snapshot?: string | null
          quantity?: number
          remark_snapshot?: string | null
          stage_entry_id?: string
          unit_weight_kg_snapshot?: number | null
        }
        Relationships: []
      }
      bending_return_items: {
        Row: {
          created_at: string
          designation_snapshot: string | null
          dispatch_item_id: string
          id: string
          production_item_id: string
          profile_snapshot: string | null
          quantity: number
          return_id: string
          stage_entry_id: string
          unit_weight_kg_snapshot: number | null
        }
        Insert: {
          created_at?: string
          designation_snapshot?: string | null
          dispatch_item_id: string
          id?: string
          production_item_id: string
          profile_snapshot?: string | null
          quantity: number
          return_id: string
          stage_entry_id: string
          unit_weight_kg_snapshot?: number | null
        }
        Update: {
          created_at?: string
          designation_snapshot?: string | null
          dispatch_item_id?: string
          id?: string
          production_item_id?: string
          profile_snapshot?: string | null
          quantity?: number
          return_id?: string
          stage_entry_id?: string
          unit_weight_kg_snapshot?: number | null
        }
        Relationships: []
      }
      bending_returns: {
        Row: {
          created_at: string
          created_by: string | null
          dispatch_id: string
          id: string
          lot_id: string
          pdf_path: string | null
          received_by_name: string | null
          return_date: string
          return_reference: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dispatch_id: string
          id?: string
          lot_id: string
          pdf_path?: string | null
          received_by_name?: string | null
          return_date?: string
          return_reference: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dispatch_id?: string
          id?: string
          lot_id?: string
          pdf_path?: string | null
          received_by_name?: string | null
          return_date?: string
          return_reference?: string
        }
        Relationships: []
      }
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
      },
      production_stage_entry_audit: {
        Row: {
          id: string
          stage_entry_id: string
          production_item_id: string
          action: 'corrected' | 'deleted'
          reason: string
          old_data: Json | null
          new_data: Json | null
          corrected_by: string | null
          corrected_by_name: string | null
          corrected_at: string
        }
        Insert: {
          id?: string
          stage_entry_id: string
          production_item_id: string
          action: 'corrected' | 'deleted'
          reason: string
          old_data?: Json | null
          new_data?: Json | null
          corrected_by?: string | null
          corrected_by_name?: string | null
          corrected_at?: string
        }
        Update: {
          id?: string
          stage_entry_id?: string
          production_item_id?: string
          action?: 'corrected' | 'deleted'
          reason?: string
          old_data?: Json | null
          new_data?: Json | null
          corrected_by?: string | null
          corrected_by_name?: string | null
          corrected_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      production_operations_report: {
        Row: {
          operation_id: string | null
          operation_date: string | null
          project_id: string | null
          project_name: string | null
          project_number_id: string | null
          project_number: string | null
          lot_id: string | null
          lot_number: string | null
          production_item_id: string | null
          article: string | null
          designation: string | null
          profile: string | null
          routing: Database['public']['Enums']['production_route'] | null
          operation: Database['public']['Enums']['production_stage'] | null
          quantity: number | null
          unit_weight_kg: number | null
          operation_weight_kg: number | null
          performed_by: string | null
          performed_by_name: string | null
          reference: string | null
        }
        Relationships: []
      },
      production_status_report: {
        Row: {
          project_id: string | null
          project_name: string | null
          project_number_id: string | null
          project_number: string | null
          lot_id: string | null
          lot_number: string | null
          production_item_id: string | null
          article: string | null
          designation: string | null
          profile: string | null
          material: string | null
          routing: Database['public']['Enums']['production_route'] | null
          unit_weight_kg: number | null
          total_quantity: number | null
          cut_total: number | null
          remaining_cut: number | null
          remaining_cut_weight_kg: number | null
          out_bend_total: number | null
          waiting_issue_packing_qty: number | null
          waiting_issue_packing_weight_kg: number | null
          bend_total: number | null
          waiting_receive_packing_qty: number | null
          waiting_receive_packing_weight_kg: number | null
          rolling_total: number | null
          waiting_rolling_qty: number | null
          waiting_rolling_weight_kg: number | null
          ready_to_dispense_qty: number | null
          ready_to_dispense_weight_kg: number | null
          dispensed_total: number | null
          remaining_to_dispense: number | null
          remaining_to_dispense_weight_kg: number | null
          next_action: string | null
          available_action_quantity: number | null
          progress_state: string | null
          completion_percent: number | null
          last_activity_at: string | null
          has_remaining_cut: boolean | null
          is_waiting_issue_packing: boolean | null
          is_waiting_receive_packing: boolean | null
          is_waiting_rolling: boolean | null
          is_ready_to_dispense: boolean | null
          is_partially_dispensed: boolean | null
          is_completed: boolean | null
          is_not_started: boolean | null
        }
        Relationships: []
      },
      production_documents_register: {
        Row: {
          approval_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          destination: string | null
          dispatch_name: string | null
          document_date: string | null
          document_id: string | null
          document_reference: string | null
          document_type: string | null
          follow_name: string | null
          item_count: number | null
          lot_id: string | null
          lot_number: string | null
          pdf_path: string | null
          project_id: string | null
          project_name: string | null
          project_number: string | null
          project_number_id: string | null
          received_by_name: string | null
          sheet_number: string | null
          source_dispatch_id: string | null
          source_dispatch_reference: string | null
          total_quantity: number | null
        }
        Relationships: []
      },
      production_lot_dashboard: {
        Row: {
          lot_id: string | null
          lot_number: string | null
          project_number_id: string | null
          project_number: string | null
          project_id: string | null
          project_name: string | null
          total_items: number | null
          active_items: number | null
          total_required_quantity: number | null
          total_cut_quantity: number | null
          remaining_cut_quantity: number | null
          total_out_bend_quantity: number | null
          remaining_out_bend_quantity: number | null
          total_bend_quantity: number | null
          remaining_bend_quantity: number | null
          total_rolling_quantity: number | null
          remaining_rolling_quantity: number | null
          warehouse_stock_quantity: number | null
          total_dispensed_quantity: number | null
          remaining_to_dispense_quantity: number | null
          items_waiting_cut: number | null
          items_waiting_out_bend: number | null
          items_waiting_bend_return: number | null
          items_waiting_rolling: number | null
          items_in_warehouse: number | null
          completed_items: number | null
          completion_percent: number | null
          last_activity_at: string | null
          in_progress_items: number | null
          not_started_items: number | null
        }
        Relationships: []
      },
      production_action_queue: {
        Row: {
          production_item_id: string | null
          lot_id: string | null
          article: string | null
          designation: string | null
          profile: string | null
          routing: Database['public']['Enums']['production_route'] | null
          total_quantity: number | null
          cut_total: number | null
          out_bend_total: number | null
          bend_total: number | null
          rolling_total: number | null
          warehouse_stock: number | null
          dispensed_total: number | null
          last_activity_at: string | null
          next_action: string | null
          available_action_quantity: number | null
          completion_percent: number | null
          lot_number: string | null
          project_number_id: string | null
          project_number: string | null
          project_id: string | null
          project_name: string | null
          progress_state: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      search_production_operations_report: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_project_id?: string
          p_project_number_id?: string
          p_lot_id?: string
          p_operations?: Database['public']['Enums']['production_stage'][]
          p_routing?: Database['public']['Enums']['production_route']
          p_article_query?: string
          p_performed_by?: string
        }
        Returns: Array<{
          operation_id: string
          operation_date: string
          project_id: string | null
          project_name: string | null
          project_number_id: string | null
          project_number: string | null
          lot_id: string | null
          lot_number: string | null
          production_item_id: string | null
          article: string | null
          designation: string | null
          profile: string | null
          routing: Database['public']['Enums']['production_route'] | null
          operation: Database['public']['Enums']['production_stage']
          quantity: number | string | null
          unit_weight_kg: number | string | null
          operation_weight_kg: number | string | null
          performed_by: string | null
          performed_by_name: string | null
          reference: string | null
        }>
      }
      search_production_status_report: {
        Args: {
          p_project_id?: string
          p_project_number_id?: string
          p_lot_id?: string
          p_statuses?: string[]
          p_routing?: Database['public']['Enums']['production_route']
          p_query?: string
          p_progress_state?: string
        }
        Returns: Array<{
          project_id: string | null
          project_name: string | null
          project_number_id: string | null
          project_number: string | null
          lot_id: string | null
          lot_number: string | null
          production_item_id: string | null
          article: string | null
          designation: string | null
          profile: string | null
          material: string | null
          routing: Database['public']['Enums']['production_route'] | null
          unit_weight_kg: number | string | null
          total_quantity: number | string | null
          cut_total: number | string | null
          remaining_cut: number | string | null
          remaining_cut_weight_kg: number | string | null
          out_bend_total: number | string | null
          waiting_issue_packing_qty: number | string | null
          waiting_issue_packing_weight_kg: number | string | null
          bend_total: number | string | null
          waiting_receive_packing_qty: number | string | null
          waiting_receive_packing_weight_kg: number | string | null
          rolling_total: number | string | null
          waiting_rolling_qty: number | string | null
          waiting_rolling_weight_kg: number | string | null
          ready_to_dispense_qty: number | string | null
          ready_to_dispense_weight_kg: number | string | null
          dispensed_total: number | string | null
          remaining_to_dispense: number | string | null
          remaining_to_dispense_weight_kg: number | string | null
          next_action: string | null
          available_action_quantity: number | string | null
          progress_state: string | null
          completion_percent: number | string | null
          last_activity_at: string | null
          has_remaining_cut: boolean | null
          is_waiting_issue_packing: boolean | null
          is_waiting_receive_packing: boolean | null
          is_waiting_rolling: boolean | null
          is_ready_to_dispense: boolean | null
          is_partially_dispensed: boolean | null
          is_completed: boolean | null
          is_not_started: boolean | null
        }>
      }
      attach_bending_dispatch_pdf: {
        Args: {
          p_dispatch_id: string
          p_pdf_path: string
        }
        Returns: Database['public']['Tables']['bending_dispatches']['Row']
      }
      attach_bending_return_pdf: {
        Args: {
          p_pdf_path: string
          p_return_id: string
        }
        Returns: Database['public']['Tables']['bending_returns']['Row']
      }
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
      create_bending_dispatch: {
        Args: {
          p_approval_name: string | null
          p_destination: string | null
          p_dispatch_date: string
          p_dispatch_name: string | null
          p_dispatch_number: string
          p_follow_name: string | null
          p_items: Json
          p_lot_id: string
          p_sheet_number: string | null
        }
        Returns: Database['public']['Tables']['bending_dispatches']['Row']
      }
      create_bending_return: {
        Args: {
          p_dispatch_id: string
          p_items: Json
          p_received_by_name: string | null
          p_return_date: string
          p_return_reference: string
        }
        Returns: string
      }
import_production_preparation_file: {
        Args: {
          p_file_name: string
          p_lot_id: string
          p_rows: Json
        }
        Returns: Json
      },
      correct_production_stage_entry: {
        Args: {
          p_entry_id: string
          p_quantity: number
          p_entry_date: string
          p_note: string | null
          p_reason: string
        }
        Returns: {
          id: string
          production_item_id: string
          stage: Database['public']['Enums']['production_stage']
          quantity: number
          entry_date: string
          note: string | null
          source: string
          source_reference: string | null
          created_at: string
          created_by: string | null
          performed_by: string | null
          performed_by_name_snapshot: string | null
        }
      },
      delete_production_stage_entry: {
        Args: {
          p_entry_id: string
          p_reason: string
        }
        Returns: {
          id: string
          production_item_id: string
          stage: Database['public']['Enums']['production_stage']
          quantity: number
          entry_date: string
          note: string | null
          source: string
          source_reference: string | null
          created_at: string
          created_by: string | null
          performed_by: string | null
          performed_by_name_snapshot: string | null
        }
      },
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
