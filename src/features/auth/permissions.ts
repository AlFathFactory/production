import type { AppRole } from './types'

export function canManageUsers(role: AppRole): boolean {
  return role === 'admin'
}

export function canCorrectProduction(role: AppRole): boolean {
  return role === 'admin'
}

export function canCreateBendingDocuments(role: AppRole): boolean {
  return role === 'admin' || role === 'supervisor'
}

export function canAddProductionStageEntry(role: AppRole): boolean {
  return role === 'admin' || role === 'supervisor' || role === 'operator'
}
