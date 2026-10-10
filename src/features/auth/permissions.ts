import type { AppRole } from './types'

export function canManageUsers(role: AppRole): boolean {
  return canAccessUserManagement(role)
}

export function canManageProduction(role: AppRole): boolean {
  return role === 'admin' || role === 'supervisor'
}

export function canManageProjects(role: AppRole): boolean {
  return canManageProduction(role)
}

export function canManageBomImports(role: AppRole): boolean {
  return role === 'admin' || role === 'supervisor'
}

export function canCorrectProduction(role: AppRole): boolean {
  return canManageProduction(role)
}

export function canCreateBendingDocuments(role: AppRole): boolean {
  return canAccessBendingDocuments(role)
}

export function canAddProductionStageEntry(role: AppRole): boolean {
  return role === 'admin' || role === 'supervisor' || role === 'operator'
}

export function canCreateProductionItems(role: AppRole): boolean {
  return canManageProduction(role)
}

export function canImportProduction(role: AppRole): boolean {
  return canManageProduction(role)
}

export function canAccessUserManagement(role: AppRole): boolean {
  return role === 'admin'
}

export function canAccessBendingDocuments(role: AppRole): boolean {
  return role === 'admin' || role === 'supervisor'
}

export function getRoleLabel(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    admin: 'Admin',
    supervisor: 'Supervisor',
    operator: 'Operator',
  }

  return labels[role]
}
