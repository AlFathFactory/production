import { supabase } from '../../services/supabase/client'
import { getProvisionUserFailure } from './provisionUserError'
import type { AppUsersRow, CreateUserInput, UpdateUserInput, UserFilters, UserListItem } from './types'

export type UsersRepositoryErrorKind = 'permission' | 'duplicate' | 'not_found' | 'network' | 'validation' | 'unknown'

export class UsersRepositoryError extends Error {
  constructor(
    public readonly kind: UsersRepositoryErrorKind,
    message: string,
  ) {
    super(message)
    this.name = 'UsersRepositoryError'
  }
}

function mapError(error: unknown, action: 'list' | 'create' | 'update'): UsersRepositoryError {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  const message = error instanceof Error ? error.message : ''

  if (code === '42501' || /permission denied/i.test(message)) {
    return new UsersRepositoryError('permission', 'You do not have permission to perform this action.')
  }

  if (code === '23505') {
    if (/employee_code/i.test(message)) {
      return new UsersRepositoryError('duplicate', 'An employee with this code already exists.')
    }
    return new UsersRepositoryError('duplicate', 'A record with this value already exists.')
  }

  if (action === 'update' && /must have at least one active admin/i.test(message)) {
    return new UsersRepositoryError('validation', 'Cannot deactivate the last active administrator.')
  }

  if (action === 'update' && /cannot deactivate yourself/i.test(message)) {
    return new UsersRepositoryError('validation', 'You cannot deactivate your own account.')
  }

  if (action === 'create' && /duplicate|already exists/i.test(message)) {
    if (/email/i.test(message)) {
      return new UsersRepositoryError('duplicate', 'An account with this email already exists.')
    }
    if (/employee_code/i.test(message)) {
      return new UsersRepositoryError('duplicate', 'An employee with this code already exists.')
    }
  }

  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new UsersRepositoryError('network', 'Unable to reach Production Control. Check your connection and try again.')
  }

  return new UsersRepositoryError('unknown', action === 'create' ? 'User could not be created.' : action === 'update' ? 'User could not be updated.' : 'Users could not be loaded.')
}

function mapUserRow(row: AppUsersRow): UserListItem {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    fullName: row.full_name,
    employeeCode: row.employee_code,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const usersRepository = {
  async listUsers(filters: UserFilters): Promise<UserListItem[]> {
    let query = supabase
      .from('app_users')
      .select('id, auth_user_id, full_name, employee_code, role, is_active, created_at, updated_at')
      .order('full_name', { ascending: true })

    if (filters.search.trim()) {
      const term = `%${filters.search.trim()}%`
      query = query.or(`full_name.ilike.${term},employee_code.ilike.${term}`)
    }

    const { data, error } = await query

    if (error) throw mapError(error, 'list')

    return (data ?? []).map(mapUserRow)
  },

  async createUser(input: CreateUserInput): Promise<UserListItem> {
    const { data, error } = await supabase.functions.invoke('provision-user', {
      body: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        full_name: input.fullName.trim(),
        employee_code: input.employeeCode.trim(),
        role: input.role,
      },
    })

    const backendError = data && typeof data === 'object' && 'error' in data
    if (error || backendError) {
      const failure = await getProvisionUserFailure(data, error)
      throw new UsersRepositoryError(failure.kind, failure.message)
    }

    return mapUserRow(data)
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<UserListItem> {
    const { data, error } = await supabase
      .from('app_users')
      .update({
        full_name: input.fullName.trim(),
        employee_code: input.employeeCode.trim(),
        role: input.role,
        is_active: input.isActive,
      })
      .eq('id', id)
      .select('id, auth_user_id, full_name, employee_code, role, is_active, created_at, updated_at')
      .single()

    if (error) throw mapError(error, 'update')

    return mapUserRow(data)
  },
}
