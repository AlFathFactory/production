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
          dispensed_to_id: string | null
          dispensed_to_name_snapshot: string | null
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
          dispensed_to_id?: string | null
          dispensed_to_name_snapshot?: string | null
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
          dispensed_to_id?: string | null
          dispensed_to_name_snapshot?: string | null
          performed_by?: string | null
          performed_by_name_snapshot?: string | null
        }
        Relationships: []
      },
      dispense_recipients: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      },
      bending_dispatches: {
        Row: {
          approval_name: string | null
          created_at: string
          created_by: string | null
          destination: string | null
          destination_id: string | null
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
          destination_id?: string | null
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
          destination_id?: string | null
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
      bending_destinations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
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
          return_reference?: string
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
      },
      bom_imports: {
        Row: { id: string; file_name: string; created_by: string; status: string; created_at: string; project_id: string | null; project_number_id: string | null; lot_id: string | null; sheet_name: string | null; header_row: number | null; root_code: string | null; parser_version: string | null; source_file_bucket: string | null; source_file_path: string | null; source_file_name: string | null; source_file_mime_type: string | null; source_file_size_bytes: number | null; source_file_sha256: string | null; source_file_uploaded_at: string | null; version_group_id: string; version_number: number; supersedes_import_id: string | null; superseded_by_import_id: string | null; activated_at: string | null; updated_at: string; updated_by: string | null }
        Insert: { id?: string; file_name: string; created_by?: string; status?: string; created_at?: string; project_id?: string | null; project_number_id?: string | null; lot_id?: string | null; sheet_name?: string | null; header_row?: number | null; root_code?: string | null; parser_version?: string | null; source_file_bucket?: string | null; source_file_path?: string | null; source_file_name?: string | null; source_file_mime_type?: string | null; source_file_size_bytes?: number | null; source_file_sha256?: string | null; source_file_uploaded_at?: string | null; version_group_id?: string; version_number?: number; supersedes_import_id?: string | null; superseded_by_import_id?: string | null; activated_at?: string | null; updated_at?: string; updated_by?: string | null }
        Update: { id?: string; file_name?: string; created_by?: string; status?: string; created_at?: string; project_id?: string | null; project_number_id?: string | null; lot_id?: string | null; sheet_name?: string | null; header_row?: number | null; root_code?: string | null; parser_version?: string | null; source_file_bucket?: string | null; source_file_path?: string | null; source_file_name?: string | null; source_file_mime_type?: string | null; source_file_size_bytes?: number | null; source_file_sha256?: string | null; source_file_uploaded_at?: string | null; version_group_id?: string; version_number?: number; supersedes_import_id?: string | null; superseded_by_import_id?: string | null; activated_at?: string | null; updated_at?: string; updated_by?: string | null }
        Relationships: []
      },
      bom_nodes: {
        Row: { id: string; bom_import_id: string; parent_id: string | null; level: number; article: string | null; position: string | null; component: string | null; article_type: string | null; source_type: string | null; description: string | null; drawing_number: string | null; quantity_per_parent: number; calculated_cumulative_quantity: number; position_weight_kg: number | null; rolled_weight_kg: number; material: string | null; source_row: number; raw_data: Json; created_at: string; code: string | null; parent_code: string | null; item_type: string; updated_at: string; formatted_raw_data: Json; excel_cumulative_quantity: number | null; created_by: string; updated_by: string | null; name: string | null; name2: string | null }
        Insert: { id?: string; bom_import_id: string; parent_id?: string | null; level: number; article?: string | null; position?: string | null; component?: string | null; article_type?: string | null; source_type?: string | null; description?: string | null; drawing_number?: string | null; quantity_per_parent: number; calculated_cumulative_quantity: number; position_weight_kg?: number | null; rolled_weight_kg: number; material?: string | null; source_row: number; raw_data: Json; code?: string | null; parent_code?: string | null; item_type: string; formatted_raw_data: Json; excel_cumulative_quantity?: number | null; name?: string | null; name2?: string | null }
        Update: { id?: string; bom_import_id?: string; parent_id?: string | null; level?: number; article?: string | null; position?: string | null; component?: string | null; article_type?: string | null; source_type?: string | null; description?: string | null; drawing_number?: string | null; quantity_per_parent?: number; calculated_cumulative_quantity?: number; position_weight_kg?: number | null; rolled_weight_kg?: number; material?: string | null; source_row?: number; raw_data?: Json; code?: string | null; parent_code?: string | null; item_type?: string; formatted_raw_data?: Json; excel_cumulative_quantity?: number | null; name?: string | null; name2?: string | null }
        Relationships: []
      },
      bom_import_warnings: {
        Row: { id: string; bom_import_id: string; warning_index: number; kind: string; source_row: number | null; message: string; details: Json; created_at: string; created_by: string }
        Insert: { id?: string; bom_import_id: string; warning_index: number; kind: string; source_row?: number | null; message: string; details: Json; created_at?: string; created_by?: string }
        Update: { id?: string; bom_import_id?: string; warning_index?: number; kind?: string; source_row?: number | null; message?: string; details?: Json; created_at?: string; created_by?: string }
        Relationships: []
      },
      bom_dimension_mappings: {
        Row: { id: string; code: string | null; description: string; token_index: number; token_raw: string; token_value: number | null; role: string; created_by: string; created_at: string; updated_at: string; updated_by: string | null }
        Insert: { id?: string; code?: string | null; description: string; token_index: number; token_raw: string; token_value?: number | null; role: string; created_by?: string; created_at?: string; updated_at?: string; updated_by?: string | null }
        Update: { id?: string; code?: string | null; description?: string; token_index?: number; token_raw?: string; token_value?: number | null; role?: string; created_by?: string; created_at?: string; updated_at?: string; updated_by?: string | null }
        Relationships: []
      }
    }
    Views: {
      bending_destination_inventory: {
        Row: {
          article: string | null
          designation: string | null
          destination_id: string | null
          destination_is_active: boolean | null
          destination_name: string | null
          dispatch_created_at: string | null
          dispatch_date: string | null
          dispatch_id: string | null
          dispatch_item_id: string | null
          dispatch_number: string | null
          issued_quantity: number | null
          issued_weight_kg: number | null
          last_return_date: string | null
          lot_id: string | null
          lot_number: string | null
          material: string | null
          outstanding_quantity: number | null
          outstanding_weight_kg: number | null
          production_item_id: string | null
          profile: string | null
          project_id: string | null
          project_name: string | null
          project_number: string | null
          project_number_id: string | null
          remark: string | null
          return_status: string | null
          returned_quantity: number | null
          returned_weight_kg: number | null
          routing: Database['public']['Enums']['production_route'] | null
          unit_weight_kg: number | null
        }
        Relationships: []
      },
      bending_destination_summary: {
        Row: {
          destination_id: string | null
          destination_is_active: boolean | null
          destination_name: string | null
          dispatch_count: number | null
          latest_dispatch_date: string | null
          lot_count: number | null
          oldest_open_dispatch_date: string | null
          outstanding_item_count: number | null
          outstanding_quantity: number | null
          outstanding_weight_kg: number | null
          project_count: number | null
        }
        Relationships: []
      },
      production_operations_report: {
        Row: {
          stage_entry_id: string | null
          operation_date: string | null
          operation: Database['public']['Enums']['production_stage'] | null
          quantity: number | string | null
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
          unit_weight_kg: number | string | null
          operation_weight_kg: number | string | null
          performed_by: string | null
          performed_by_name: string | null
          source: string | null
          source_reference: string | null
          note: string | null
          created_at: string | null
          dispensed_to_id: string | null
          dispensed_to_name: string | null
        }
        Relationships: []
      },
      production_dispense_history: {
        Row: {
          stage_entry_id: string | null
          dispense_date: string | null
          created_at: string | null
          dispensed_to_id: string | null
          dispensed_to_name: string | null
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
          quantity: number | string | null
          unit_weight_kg: number | string | null
          dispense_weight_kg: number | string | null
          performed_by: string | null
          performed_by_name: string | null
          note: string | null
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
      },
      bom_current_versions: {
        Row: { id: string | null; file_name: string | null; created_by: string | null; status: string | null; created_at: string | null; project_id: string | null; project_number_id: string | null; lot_id: string | null; sheet_name: string | null; header_row: number | null; root_code: string | null; parser_version: string | null; source_file_path: string | null; source_file_name: string | null; updated_at: string | null; updated_by: string | null; source_file_bucket: string | null; source_file_mime_type: string | null; source_file_size_bytes: number | null; source_file_sha256: string | null; source_file_uploaded_at: string | null; version_group_id: string | null; version_number: number | null; supersedes_import_id: string | null; superseded_by_import_id: string | null; activated_at: string | null }
        Relationships: []
      },
      bom_summary: {
        Row: { bom_import_id: string | null; root_code: string | null; rows: number | null; levels: number | null; unique_codes: number | null; assemblies: number | null; parts: number | null; materials: number | null; leaf_items: number | null; total_calculated_leaf_mass_kg: number | null }
        Relationships: []
      },
      bom_reuse_counts: {
        Row: { bom_import_id: string | null; code: string | null; reuse_count: number | null; is_reused: boolean | null }
        Relationships: []
      },
      bom_rolled_up_leaf_parts: {
        Row: { bom_import_id: string | null; code: string | null; description: string | null; material: string | null; occurrence_count: number | null; total_quantity: number | null; unit_weight_kg: number | null; total_weight_kg: number | null }
        Relationships: []
      },
      bom_production_extraction_candidates: {
        Row: { bom_import_id: string | null; version_group_id: string | null; version_number: number | null; lot_id: string | null; representative_node_id: string | null; article: string | null; name: string | null; name2: string | null; designation: string | null; material: string | null; source_type: string | null; drawing_number: string | null; occurrence_count: number | null; total_quantity: number | null; unit_weight_kg: number | null; total_weight_kg: number | null; profile: string | null; length_value: number | null; width_value: number | null; height_value: number | null; requires_routing_assignment: boolean | null; blockers: Json | null; is_ready_for_production: boolean | null }
        Relationships: []
      }
    }
    Functions: {
      create_bom_import: {
        Args: { p_file_name: string; p_sheet_name: string; p_header_row: number; p_root_code: string; p_parser_version: string; p_project_id: string; p_project_number_id: string; p_lot_id: string; p_source_file_path?: string; p_source_file_name?: string }
        Returns: Database['public']['Tables']['bom_imports']['Row']
      }
      attach_bom_import_source_file: {
        Args: { p_bom_import_id: string; p_object_path: string; p_original_file_name: string; p_mime_type: string; p_size_bytes: number; p_sha256: string }
        Returns: Database['public']['Tables']['bom_imports']['Row']
      }
      create_bom_reimport: {
        Args: { p_previous_import_id: string; p_file_name: string; p_sheet_name: string; p_header_row: number; p_root_code: string; p_parser_version: string; p_source_file_name: string }
        Returns: Database['public']['Tables']['bom_imports']['Row']
      }
      delete_bom_import: { Args: { p_bom_import_id: string; p_confirmation: string }; Returns: Json }
      insert_bom_nodes_bulk: { Args: { p_bom_import_id: string; p_nodes: Json }; Returns: Json }
      replace_bom_import_nodes: { Args: { p_bom_import_id: string; p_nodes: Json }; Returns: Json }
      validate_bom_import_nodes: { Args: { p_nodes: Json }; Returns: Json }
      get_bom_tree: {
        Args: { p_bom_import_id: string }
        Returns: Array<{ id: string; bom_import_id: string; parent_id: string | null; level: number; source_row: number; code: string; parent_code: string | null; position: string; article_type: string; item_type: string; source_type: string; name: string; name2: string; description: string; drawing_number: string; material: string; quantity_per_parent: number; calculated_cumulative_quantity: number; excel_cumulative_quantity: number | null; position_weight_kg: number | null; rolled_weight_kg: number }>
      }
      get_bom_node_details: {
        Args: { p_node_id: string }
        Returns: Array<{ id: string; bom_import_id: string; parent_id: string | null; level: number; source_row: number; code: string; parent_code: string | null; position: string; article_type: string; item_type: string; source_type: string; name: string; name2: string; description: string; drawing_number: string; material: string; quantity_per_parent: number; calculated_cumulative_quantity: number; excel_cumulative_quantity: number | null; position_weight_kg: number | null; rolled_weight_kg: number; raw_data: Json; formatted_raw_data: Json; created_at: string; updated_at: string }>
      }
      get_bom_dimension_mapping: {
        Args: { p_code: string; p_description: string }
        Returns: Array<{ id: string; code: string; description: string; token_index: number; token_raw: string; token_value: number; role: string; match_scope: string; created_by: string; created_at: string; updated_at: string }>
      }
      save_bom_dimension_mapping: { Args: { p_code: string; p_description: string; p_assignments: Json }; Returns: Json }
      get_bom_production_extraction_preview: { Args: { p_bom_import_id: string }; Returns: Array<Database['public']['Views']['bom_production_extraction_candidates']['Row']> }
      search_bending_destination_inventory: {
        Args: {
          p_destination_id?: string
          p_outstanding_only?: boolean
        }
        Returns: Array<{
          article: string | null
          designation: string | null
          destination_id: string | null
          destination_is_active: boolean | null
          destination_name: string | null
          dispatch_created_at: string | null
          dispatch_date: string | null
          dispatch_id: string | null
          dispatch_item_id: string | null
          dispatch_number: string | null
          issued_quantity: number | string | null
          issued_weight_kg: number | string | null
          last_return_date: string | null
          lot_id: string | null
          lot_number: string | null
          material: string | null
          outstanding_quantity: number | string | null
          outstanding_weight_kg: number | string | null
          production_item_id: string | null
          profile: string | null
          project_id: string | null
          project_name: string | null
          project_number: string | null
          project_number_id: string | null
          remark: string | null
          return_status: string | null
          returned_quantity: number | string | null
          returned_weight_kg: number | string | null
          routing: Database['public']['Enums']['production_route'] | null
          unit_weight_kg: number | string | null
        }>
      }
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
          stage_entry_id: string
          operation_date: string
          operation: Database['public']['Enums']['production_stage']
          quantity: number | string | null
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
          unit_weight_kg: number | string | null
          operation_weight_kg: number | string | null
          performed_by: string | null
          performed_by_name: string | null
          source: string | null
          source_reference: string | null
          note: string | null
          created_at: string | null
          dispensed_to_id: string | null
          dispensed_to_name: string | null
        }>
      }
      search_production_dispense_history: {
        Args: {
          p_recipient_id?: string
          p_recipient_name?: string
          p_date_from?: string
          p_date_to?: string
          p_project_id?: string
          p_project_number_id?: string
          p_lot_id?: string
          p_query?: string
        }
        Returns: Array<{
          stage_entry_id: string
          dispense_date: string
          created_at: string | null
          dispensed_to_id: string | null
          dispensed_to_name: string | null
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
          quantity: number | string | null
          unit_weight_kg: number | string | null
          dispense_weight_kg: number | string | null
          performed_by: string | null
          performed_by_name: string | null
          note: string | null
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
      create_production_dispense: {
        Args: {
          p_recipient_name: string
          p_entry_date?: string
          p_note?: string
          p_items?: Json
        }
        Returns: Array<Database['public']['Tables']['production_stage_entries']['Row']>
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
      validate_production_preparation_rows: {
        Args: {
          p_lot_id: string
          p_rows: Json
        }
        Returns: Json
      }
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
      delete_production_project_with_data: {
        Args: {
          p_project_id: string
          p_confirmation: string
        }
        Returns: Json
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
