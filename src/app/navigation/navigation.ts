import {
  canAccessBendingDocuments,
  canAccessUserManagement,
} from '../../features/auth/permissions'
import type { NavigationItem } from './types'

export const primaryNavigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Projects', path: '/projects', icon: 'projects' },
  { label: 'Follow Up', path: '/production', icon: 'production' },
  {
    label: 'Packing',
    path: '/bending',
    icon: 'bending',
    isVisible: canAccessBendingDocuments,
    children: [
      { label: 'Issue Packing', path: '/bending/issue' },
      { label: 'Receive Packing', path: '/bending/receive' },
    ],
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
  for (const item of allNavigationItems) {
    if (item.path === pathname) return item.label
    const child = item.children?.find((entry) => entry.path === pathname)
    if (child) return child.label
  }
  return null
}
