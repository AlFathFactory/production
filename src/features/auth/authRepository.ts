import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

import { supabase } from '../../services/supabase/client'
import type {
  AuthFailureCode,
  AuthUserProfile,
  SignInCredentials,
} from './types'

const PROFILE_COLUMNS =
  'id, auth_user_id, full_name, employee_code, role, is_active'

export class AuthRepositoryError extends Error {
  constructor(
    public readonly code: AuthFailureCode,
    message: string,
  ) {
    super(message)
    this.name = 'AuthRepositoryError'
  }
}

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      /fetch|network|connection|offline/i.test(error.message))
  )
}

function mapSignInError(error: unknown): AuthRepositoryError {
  if (
    error instanceof Error &&
    /invalid login credentials|email not confirmed/i.test(error.message)
  ) {
    return new AuthRepositoryError(
      'invalid_credentials',
      'The email or password is incorrect.',
    )
  }

  if (isNetworkError(error)) {
    return new AuthRepositoryError(
      'network_error',
      'Unable to reach the sign-in service. Check your connection and try again.',
    )
  }

  return new AuthRepositoryError(
    'unexpected_error',
    'Sign in could not be completed. Please try again.',
  )
}

export const authRepository = {
  async signIn(credentials: SignInCredentials): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword(credentials)

    if (error) {
      throw mapSignInError(error)
    }

    if (!data.session) {
      throw new AuthRepositoryError(
        'unexpected_error',
        'Sign in could not be completed. Please try again.',
      )
    }

    return data.session
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut({ scope: 'local' })

    if (error) {
      throw new AuthRepositoryError(
        isNetworkError(error) ? 'network_error' : 'unexpected_error',
        'Sign out could not be completed. Please try again.',
      )
    }
  },

  async getCurrentSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw new AuthRepositoryError(
        isNetworkError(error) ? 'network_error' : 'unexpected_error',
        'Your session could not be restored. Please sign in again.',
      )
    }

    return data.session
  },

  async getUserProfile(authUserId: string): Promise<AuthUserProfile | null> {
    const { data, error } = await supabase
      .from('app_users')
      .select(PROFILE_COLUMNS)
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error) {
      throw new AuthRepositoryError(
        isNetworkError(error) ? 'network_error' : 'profile_unavailable',
        'Your employee profile could not be loaded.',
      )
    }

    return data
  },

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ): () => void {
    const { data } = supabase.auth.onAuthStateChange(callback)
    return () => data.subscription.unsubscribe()
  },
}
