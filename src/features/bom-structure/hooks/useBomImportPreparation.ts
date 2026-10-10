import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { useLots } from '../../projects/queries/useLots'
import { useProjectNumbers } from '../../projects/queries/useProjectNumbers'
import { useProjects } from '../../projects/queries/useProjects'
import {
  BOM_PARSER_VERSION,
  getBomSourceMimeType,
  getBomSourceObjectPath,
  sha256BomSourceFile,
} from '../bomSourceFile'
import { bomRepository } from '../repositories/bomRepository'
import type { BomParseResult } from '../types'
import type { BomImport } from '../types/bomDomain.types'

export type BomPreparationStage = 'idle' | 'hashing' | 'creating' | 'uploading' | 'attaching' | 'complete'

type PreparationInput = {
  file: File
  parsed: BomParseResult
} & ({
  mode: 'reimport'
  previousImportId: string
} | {
  mode: 'new'
  projectId: string
  projectNumberId: string
  lotId: string
})

interface PreparationAttempt {
  file: File
  importItem: BomImport
  mimeType: string
  objectPath: string
  sha256: string
  uploaded: boolean
}

export function useBomImportPreparation() {
  const queryClient = useQueryClient()
  const [projectId, setProjectId] = useState('')
  const [projectNumberId, setProjectNumberId] = useState('')
  const [lotId, setLotId] = useState('')
  const [stage, setStage] = useState<BomPreparationStage>('idle')
  const [attempt, setAttempt] = useState<PreparationAttempt | null>(null)
  const projectsQuery = useProjects()
  const projectNumbersQuery = useProjectNumbers(projectId || null)
  const lotsQuery = useLots(projectNumberId || null)

  const mutation = useMutation({
    mutationFn: async (input: PreparationInput) => {
      if (!input.parsed.summary.rootCode || !input.parsed.sheetName || input.parsed.headerRow < 1) {
        throw new Error('The parsed workbook is missing a root code, sheet name, or header row.')
      }
      if (input.mode === 'new' && (!input.projectId || !input.projectNumberId || !input.lotId)) {
        throw new Error('Choose a project, project number, and lot before creating the import.')
      }
      if (input.mode === 'new' && (!projectsQuery.data?.some((project) => project.id === input.projectId)
        || !projectNumbersQuery.data?.some((number) => number.id === input.projectNumberId && number.project_id === input.projectId)
        || !lotsQuery.data?.some((lot) => lot.id === input.lotId && lot.project_number_id === input.projectNumberId))) {
        throw new Error('The selected project hierarchy is no longer available. Refresh the choices and try again.')
      }

      let currentAttempt = attempt
      if (currentAttempt && currentAttempt.file !== input.file) {
        throw new Error('Finish attaching the previous workbook before selecting another one.')
      }

      if (!currentAttempt) {
        const mimeType = getBomSourceMimeType(input.file)
        setStage('hashing')
        const sha256 = await sha256BomSourceFile(input.file)
        setStage('creating')
        const source = {
          p_file_name: input.file.name,
          p_sheet_name: input.parsed.sheetName,
          p_header_row: input.parsed.headerRow,
          p_root_code: input.parsed.summary.rootCode,
          p_parser_version: BOM_PARSER_VERSION,
        }
        const importItem = input.mode === 'reimport'
          ? await bomRepository.createReimport({ ...source, p_previous_import_id: input.previousImportId, p_source_file_name: input.file.name })
          : await bomRepository.createImport({ ...source, p_project_id: input.projectId, p_project_number_id: input.projectNumberId, p_lot_id: input.lotId })
        currentAttempt = {
          file: input.file,
          importItem,
          mimeType,
          objectPath: getBomSourceObjectPath(importItem.id, input.file.name),
          sha256,
          uploaded: false,
        }
        setAttempt(currentAttempt)
        void queryClient.invalidateQueries({ queryKey: ['bom', 'imports'] })
      }

      if (!currentAttempt.uploaded) {
        setStage('uploading')
        const uploaded = await bomRepository.uploadSourceFile(currentAttempt.objectPath, currentAttempt.file)
        if (uploaded.path !== currentAttempt.objectPath) {
          throw new Error('The uploaded workbook path did not match the expected import path.')
        }
        currentAttempt = { ...currentAttempt, uploaded: true }
        setAttempt(currentAttempt)
      }

      setStage('attaching')
      const attachedImport = await bomRepository.attachSourceFile({
        p_bom_import_id: currentAttempt.importItem.id,
        p_object_path: currentAttempt.objectPath,
        p_original_file_name: currentAttempt.file.name,
        p_mime_type: currentAttempt.mimeType,
        p_size_bytes: currentAttempt.file.size,
        p_sha256: currentAttempt.sha256,
      })
      if (attachedImport.id !== currentAttempt.importItem.id
        || attachedImport.sourceFileBucket !== 'bom-imports'
        || attachedImport.sourceFilePath !== currentAttempt.objectPath
        || attachedImport.sourceFileName !== currentAttempt.file.name
        || attachedImport.sourceFileMimeType !== currentAttempt.mimeType
        || attachedImport.sourceFileSizeBytes !== currentAttempt.file.size
        || attachedImport.sourceFileSha256 !== currentAttempt.sha256) {
        throw new Error('The source attachment returned unexpected BOM import metadata.')
      }
      setAttempt({ ...currentAttempt, importItem: attachedImport })
      setStage('complete')
      return { importItem: attachedImport, objectPath: currentAttempt.objectPath, sha256: currentAttempt.sha256 }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bom', 'imports'] })
    },
  })

  const selectProject = (value: string) => {
    setProjectId(value)
    setProjectNumberId('')
    setLotId('')
  }

  const selectProjectNumber = (value: string) => {
    setProjectNumberId(value)
    setLotId('')
  }

  const reset = () => {
    if (mutation.isPending) return
    setAttempt(null)
    setStage('idle')
    mutation.reset()
  }

  return {
    attempt,
    isBusy: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    isComplete: stage === 'complete',
    lotId,
    lotsQuery,
    mutation,
    projectId,
    projectNumberId,
    projectNumbersQuery,
    projectsQuery,
    reset,
    selectProject,
    selectProjectNumber,
    setLotId,
    stage,
  }
}
