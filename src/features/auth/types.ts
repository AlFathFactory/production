import type { Session } from '@supabase/supabase-js'

import type { AppRole } from '../../types/database'

export type { AppRole }

export interface AuthUserProfile {
  id: string
  auth_user_id: string | null
  full_name: string
  employee_code: string
  role: AppRole
  is_active: boolean
}

export interface SignInCredentials {
  email: string
  password: string
}

export type AuthFailureCode =
  | 'invalid_credentials'
  | 'network_error'
  | 'profile_unavailable'
  | 'unexpected_error'

export interface AuthState {
  session: Session | null
  userProfile: AuthUserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  signOut: () => Promise<void>
  retryProfile: () => Promise<void>
}
