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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      app_role: AppRole
    }
    CompositeTypes: Record<string, never>
  }
}
