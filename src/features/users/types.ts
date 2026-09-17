import type { Database } from '../../types/database'

export type AppRole = Database['public']['Enums']['app_role']
export type AppUsersRow = Database['public']['Tables']['app_users']['Row']
export type AppUsersInsert = Database['public']['Tables']['app_users']['Insert']
export type AppUsersUpdate = Database['public']['Tables']['app_users']['Update']

export interface UserListItem {
  id: string
  authUserId: string | null
  fullName: string
  employeeCode: string
  role: AppRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  email: string
  password: string
  fullName: string
  employeeCode: string
  role: AppRole
}

export interface CreateUserFormValues {
  email: string
  password: string
  fullName: string
  employeeCode: string
  role: AppRole
}

export interface UpdateUserInput {
  fullName: string
  employeeCode: string
  role: AppRole
  isActive: boolean
}

export interface UserFilters {
  search: string
}

export class BackendGapError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BackendGapError'
  }
}