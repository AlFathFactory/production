export type BomRecoveryTone = 'info' | 'warning'

export interface BomRecoveryAdvice {
  tone: BomRecoveryTone
  message: string
}

export interface BomRecoveryInput {
  preparationStage: 'idle' | 'hashing' | 'creating' | 'uploading' | 'attaching' | 'complete'
  preparationError: string | null
  hasAttempt: boolean
  sourceUploaded: boolean
  saveError: string | null
  replaceError: string | null
  extractionError: string | null
}

/**
 * Maps a failed pipeline state to one actionable recovery step.
 * Priority follows the pipeline order so the earliest unresolved failure
 * is reported first; later stages cannot succeed until it is resolved.
 */
export function getBomRecoveryAdvice(input: BomRecoveryInput): BomRecoveryAdvice | null {
  if (input.preparationError) {
    if (!input.hasAttempt) {
      return {
        message: 'The import record was not created. Resolve the error above and submit again — no database record exists yet.',
        tone: 'warning',
      }
    }
    if (input.preparationStage === 'uploading' || !input.sourceUploaded) {
      return {
        message: 'The import record exists but the workbook upload failed. Retry the source attachment — it reuses the same import record instead of creating a duplicate.',
        tone: 'warning',
      }
    }
    return {
      message: 'The workbook upload succeeded but the source attachment failed. Retry the attachment on the same import record; do not start a new import.',
      tone: 'warning',
    }
  }
  if (input.saveError || input.replaceError) {
    const message = input.saveError ?? input.replaceError ?? ''
    if (/reopen|review/i.test(message)) {
      return {
        message: 'The save outcome is ambiguous (possible network failure). Reopen this import to check whether the structure was saved before retrying.',
        tone: 'warning',
      }
    }
    return {
      message: 'The source workbook is attached but the structure was not saved. Re-validate and save on the same import — do not create a new import.',
      tone: 'warning',
    }
  }
  if (input.extractionError) {
    return {
      message: 'Production extraction did not complete. Reload the extraction status first: a repeat uses the same request ID and never writes duplicates.',
      tone: 'info',
    }
  }
  return null
}
