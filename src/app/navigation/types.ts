import type { AppRole } from '../../features/auth/types'

export type NavigationIcon =
  | 'dashboard'
  | 'projects'
  | 'production'
  | 'bending'
  | 'documents'
  | 'users'

export interface NavigationItem {
  label: string
  path: string
  icon: NavigationIcon
  isVisible?: (role: AppRole) => boolean
  children?: { label: string; path: string }[]
}
