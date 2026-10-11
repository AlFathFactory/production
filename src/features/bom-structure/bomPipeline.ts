export type BomPipelineStageState = 'pending' | 'active' | 'done' | 'failed'

export interface BomPipelineStage {
  key: 'parsing' | 'validating' | 'creating' | 'uploading' | 'attaching' | 'saving' | 'refreshing' | 'complete'
  label: string
  state: BomPipelineStageState
}

export interface BomPipelineInput {
  isParsing: boolean
  parseError: string | null
  hasParsed: boolean
  preparationStage: 'idle' | 'hashing' | 'creating' | 'uploading' | 'attaching' | 'complete'
  preparationError: string | null
  sourceUploaded: boolean
  preparationComplete: boolean
  isValidating: boolean
  validationError: string | null
  hasValidation: boolean
  isSaving: boolean
  saveError: string | null
  hasSaved: boolean
  isRefreshing: boolean
  isPersisted: boolean
}

const LABELS: Array<Pick<BomPipelineStage, 'key' | 'label'>> = [
  { key: 'parsing', label: 'Parsing' },
  { key: 'validating', label: 'Validating' },
  { key: 'creating', label: 'Creating Import' },
  { key: 'uploading', label: 'Uploading File' },
  { key: 'attaching', label: 'Attaching Metadata' },
  { key: 'saving', label: 'Saving Structure' },
  { key: 'refreshing', label: 'Refreshing Data' },
  { key: 'complete', label: 'Complete' },
]

export function buildBomPipelineStages(input: BomPipelineInput): BomPipelineStage[] {
  const creatingActive = input.preparationStage === 'hashing' || input.preparationStage === 'creating'
  const creatingDone = input.preparationComplete || input.sourceUploaded
    || input.preparationStage === 'uploading' || input.preparationStage === 'attaching'
  const uploadingDone = input.preparationComplete || input.sourceUploaded || input.preparationStage === 'attaching'
  const savingDone = input.hasSaved || (input.isPersisted && input.preparationComplete)

  const states: Record<BomPipelineStage['key'], BomPipelineStageState> = {
    parsing: input.parseError ? 'failed' : input.hasParsed ? 'done' : input.isParsing ? 'active' : 'pending',
    validating: input.validationError ? 'failed' : input.hasValidation ? 'done' : input.isValidating ? 'active' : 'pending',
    creating: input.preparationError && creatingActive ? 'failed' : creatingDone ? 'done' : creatingActive ? 'active' : 'pending',
    uploading: input.preparationError && input.preparationStage === 'uploading' ? 'failed'
      : uploadingDone ? 'done' : input.preparationStage === 'uploading' ? 'active' : 'pending',
    attaching: input.preparationError && input.preparationStage === 'attaching' ? 'failed'
      : input.preparationComplete ? 'done' : input.preparationStage === 'attaching' ? 'active' : 'pending',
    saving: input.saveError ? 'failed' : savingDone ? 'done' : input.isSaving ? 'active' : 'pending',
    refreshing: input.isPersisted ? 'done' : input.isRefreshing ? 'active' : 'pending',
    complete: input.isPersisted && (input.hasSaved || input.preparationComplete) ? 'done' : 'pending',
  }

  return LABELS.map(({ key, label }) => ({ key, label, state: states[key] }))
}

export function isBomPipelineActive(stages: BomPipelineStage[]): boolean {
  return stages.some((stage) => stage.state === 'active' || stage.state === 'failed' || stage.state === 'done')
}
