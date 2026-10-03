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

export interface DeleteProjectWithDataCounts {
  projectNumbers: number
  lots: number
  productionItems: number
  stageEntries: number
  dispatches: number
  returns: number
  imports: number
}

export interface DeleteProjectWithDataResult {
  projectId: string
  projectName: string
  deleted: DeleteProjectWithDataCounts
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function finiteCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
}

function parseProjectPurgeResult(projectId: string, data: unknown): DeleteProjectWithDataResult {
  if (!isRecord(data)) {
    throw new ProjectsRepositoryError('Project deletion failed. No data was deleted.')
  }

  const deleted = isRecord(data.deleted) ? data.deleted : {}

  return {
    projectId: typeof data.project_id === 'string' ? data.project_id : projectId,
    projectName: typeof data.project_name === 'string' ? data.project_name : '',
    deleted: {
      projectNumbers: finiteCount(deleted.project_numbers),
      lots: finiteCount(deleted.lots),
      productionItems: finiteCount(deleted.production_items),
      stageEntries: finiteCount(deleted.stage_entries),
      dispatches: finiteCount(deleted.dispatches),
      returns: finiteCount(deleted.returns),
      imports: finiteCount(deleted.imports),
    },
  }
}

function mapProjectPurgeError(error: unknown): ProjectsRepositoryError {
  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String(error.message)
    : error instanceof Error
      ? error.message
      : ''

  if (/Admin access required/i.test(message)) {
    return new ProjectsRepositoryError('You do not have permission to delete projects with data. Admin access required.')
  }

  if (/Project not found/i.test(message)) {
    return new ProjectsRepositoryError('The project is no longer available. It may have been deleted already.')
  }

  if (/confirmation does not match/i.test(message)) {
    return new ProjectsRepositoryError('Project name confirmation does not match. Type the exact project name.')
  }

  if (typeof error === 'object' && error !== null && 'code' in error && String(error.code) === '42501') {
    return new ProjectsRepositoryError('You do not have permission to delete projects with data.')
  }

  if (error instanceof TypeError || /fetch|network|connection|offline/i.test(message)) {
    return new ProjectsRepositoryError('Unable to reach Production Control. Check your connection and try again.')
  }

  return new ProjectsRepositoryError('Project deletion failed. No data was deleted.')
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

  async deleteProjectWithData(projectId: string, confirmation: string): Promise<DeleteProjectWithDataResult> {
    const { data, error } = await supabase.rpc('delete_production_project_with_data', {
      p_project_id: projectId,
      p_confirmation: confirmation,
    })

    if (error) {
      throw mapProjectPurgeError(error)
    }

    return parseProjectPurgeResult(projectId, data)
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
