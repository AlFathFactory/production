import type { ProductionRoute } from '../production/types'

export interface BomRouteAssignmentOption {
  id: string
  route: ProductionRoute
  label: string
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateBomRouteAssignmentOptionInput {
  route: ProductionRoute
  label: string
  isActive: boolean
  sortOrder: number
}

export type UpdateBomRouteAssignmentOptionInput = Omit<CreateBomRouteAssignmentOptionInput, 'route'>

export interface DesignationTypeSetting {
  id: string
  name: string
  isActive: boolean
  sortOrder: number
}

export interface DesignationMappingSetting {
  id: string
  code: string
  typeId: string
  isActive: boolean
  sortOrder: number
}

export interface DesignationTypeInput {
  name: string
  isActive: boolean
  sortOrder: number
}

export interface DesignationMappingInput {
  code: string
  typeId: string
  isActive: boolean
  sortOrder: number
}
