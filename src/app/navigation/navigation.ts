import {
  canAccessBendingDocuments,
  canAccessUserManagement,
} from '../../features/auth/permissions'
import type { NavigationItem } from './types'

export const primaryNavigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Projects', path: '/projects', icon: 'projects' },
  { label: 'Production', path: '/production', icon: 'production' },
  {
    label: 'Bending',
    path: '/bending',
    icon: 'bending',
    isVisible: canAccessBendingDocuments,
  },
  { label: 'Documents', path: '/documents', icon: 'documents' },
]

export const administrationNavigationItems: NavigationItem[] = [
  {
    label: 'Users',
    path: '/users',
    icon: 'users',
    isVisible: canAccessUserManagement,
  },
]

export const allNavigationItems = [
  ...primaryNavigationItems,
  ...administrationNavigationItems,
]

export function getNavigationLabel(pathname: string): string | null {
  return allNavigationItems.find((item) => item.path === pathname)?.label ?? null
}
