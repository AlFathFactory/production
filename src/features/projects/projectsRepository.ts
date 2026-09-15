import { supabase } from '../../services/supabase/client'
import type {
  HierarchyStatus,
  Lot,
  LotFormValues,
  Project,
  ProjectFormValues,
  ProjectNumber,
  ProjectNumberFormValues,
} from './types'
import { naturalCompare, normalizeOptionalText } from './utils'

const PROJECT_COLUMNS = 'id, project_name, notes, is_active, created_at, updated_at'
const PROJECT_NUMBER_COLUMNS = 'id, project_id, project_number, status, notes, created_at, updated_at'
const LOT_COLUMNS = 'id, project_number_id, lot_number, status, notes, created_at, updated_at'

export class ProjectsRepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProjectsRepositoryError'
  }
}

function mapProjectsError(error: unknown, action: 'load' | 'save' | 'delete'): ProjectsRepositoryError {
  const errorCode = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''

  if (errorCode === '23505') {
    return new ProjectsRepositoryError('This project number or lot number already exists for its parent.')
  }

  if (errorCode === '23503' && action === 'delete') {
    return new ProjectsRepositoryError('This record cannot be deleted because related data still exists.')
  }

  if (errorCode === '42501') {
    return new ProjectsRepositoryError('You do not have permission to make this change.')
  }

  if (errorCode === 'PGRST116' && action !== 'load') {
    return new ProjectsRepositoryError('The record is no longer available or you do not have permission to change it.')
  }

  if (error instanceof TypeError || (error instanceof Error && /fetch|network|connection|offline/i.test(error.message))) {
    return new ProjectsRepositoryError('Unable to reach Production Control. Check your connection and try again.')
  }

  return new ProjectsRepositoryError(
    action === 'load'
      ? 'The requested project information could not be loaded. Please try again.'
      : action === 'delete'
        ? 'This record could not be deleted. Please try again.'
        : 'This change could not be saved. Please try again.',
  )
}

function asHierarchyStatus(status: string): HierarchyStatus {
  return status as HierarchyStatus
}

function toProjectNumber(projectNumber: { status: string } & Omit<ProjectNumber, 'status'>): ProjectNumber {
  return { ...projectNumber, status: asHierarchyStatus(projectNumber.status) }
}

function toLot(lot: { status: string } & Omit<Lot, 'status'>): Lot {
  return { ...lot, status: asHierarchyStatus(lot.status) }
}

export const projectsRepository = {
  async listProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('production_projects')
      .select(PROJECT_COLUMNS)
      .order('project_name', { ascending: true })

    if (error) {
      throw mapProjectsError(error, 'load')
    }

    return data
  },

  async listProjectNumbers(projectId: string): Promise<ProjectNumber[]> {
    const { data, error } = await supabase
      .from('production_project_numbers')
      .select(PROJECT_NUMBER_COLUMNS)
      .eq('project_id', projectId)

    if (error) {
      throw mapProjectsError(error, 'load')
    }

    return data
      .map(toProjectNumber)
      .sort((first, second) => naturalCompare(first.project_number, second.project_number))
  },

  async listLots(projectNumberId: string): Promise<Lot[]> {
    const { data, error } = await supabase
      .from('production_lots')
      .select(LOT_COLUMNS)
      .eq('project_number_id', projectNumberId)

    if (error) {
      throw mapProjectsError(error, 'load')
    }

    return data.map(toLot).sort((first, second) => naturalCompare(first.lot_number, second.lot_number))
  },

  async createProject(values: ProjectFormValues): Promise<Project> {
    const { data, error } = await supabase
      .from('production_projects')
      .insert({
        project_name: values.projectName.trim(),
        notes: normalizeOptionalText(values.notes),
        is_active: values.isActive,
      })
      .select(PROJECT_COLUMNS)
      .single()

    if (error) {
      throw mapProjectsError(error, 'save')
    }

    return data
  },

  async updateProject(id: string, values: ProjectFormValues): Promise<Project> {
    const { data, error } = await supabase
      .from('production_projects')
      .update({
        project_name: values.projectName.trim(),
        notes: normalizeOptionalText(values.notes),
        is_active: values.isActive,
      })
      .eq('id', id)
      .select(PROJECT_COLUMNS)
      .single()

    if (error) {
      throw mapProjectsError(error, 'save')
    }

    return data
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase.from('production_projects').delete().eq('id', id)

    if (error) {
      throw mapProjectsError(error, 'delete')
    }
  },

  async createProjectNumber(projectId: string, values: ProjectNumberFormValues): Promise<ProjectNumber> {
    const { data, error } = await supabase
      .from('production_project_numbers')
      .insert({
        project_id: projectId,
        project_number: values.projectNumber.trim(),
        status: values.status,
        notes: normalizeOptionalText(values.notes),
      })
      .select(PROJECT_NUMBER_COLUMNS)
      .single()

    if (error) {
      throw mapProjectsError(error, 'save')
    }

    return toProjectNumber(data)
  },

  async updateProjectNumber(id: string, values: ProjectNumberFormValues): Promise<ProjectNumber> {
    const { data, error } = await supabase
      .from('production_project_numbers')
      .update({
        project_number: values.projectNumber.trim(),
        status: values.status,
        notes: normalizeOptionalText(values.notes),
      })
      .eq('id', id)
      .select(PROJECT_NUMBER_COLUMNS)
      .single()

    if (error) {
      throw mapProjectsError(error, 'save')
    }

    return toProjectNumber(data)
  },

  async deleteProjectNumber(id: string): Promise<void> {
    const { error } = await supabase.from('production_project_numbers').delete().eq('id', id)

    if (error) {
      throw mapProjectsError(error, 'delete')
    }
  },

  async createLot(projectNumberId: string, values: LotFormValues): Promise<Lot> {
    const { data, error } = await supabase
      .from('production_lots')
      .insert({
        project_number_id: projectNumberId,
        lot_number: values.lotNumber.trim(),
        status: values.status,
        notes: normalizeOptionalText(values.notes),
      })
      .select(LOT_COLUMNS)
      .single()

    if (error) {
      throw mapProjectsError(error, 'save')
    }

    return toLot(data)
  },

  async updateLot(id: string, values: LotFormValues): Promise<Lot> {
    const { data, error } = await supabase
      .from('production_lots')
      .update({
        lot_number: values.lotNumber.trim(),
        status: values.status,
        notes: normalizeOptionalText(values.notes),
      })
      .eq('id', id)
      .select(LOT_COLUMNS)
      .single()

    if (error) {
      throw mapProjectsError(error, 'save')
    }

    return toLot(data)
  },

  async deleteLot(id: string): Promise<void> {
    const { error } = await supabase.from('production_lots').delete().eq('id', id)

    if (error) {
      throw mapProjectsError(error, 'delete')
    }
  },
}
