import { useCallback, useRef, useState } from 'react'

import { isDesktopRuntime } from '../../../config/platform'
import { savePdfFile } from '../../../services/files/pdfFiles'
import { attachBendingPdf } from '../attachBendingPdf'
import type { BendingPdfTarget } from '../types'

type LocalPdfSaveState =
  | { status: 'saving' }
  | { error: string; status: 'failed' }
  | { path: string; status: 'saved' }

export type BendingPdfAttachmentState =
  | { status: 'idle' }
  | { status: 'attaching'; target: BendingPdfTarget }
  | { localSave?: LocalPdfSaveState; path: string; status: 'attached'; target: BendingPdfTarget }
  | { error: string; status: 'failed'; target: BendingPdfTarget }

export function useBendingPdfAttachment() {
  const [state, setState] = useState<BendingPdfAttachmentState>({ status: 'idle' })
  const runIdRef = useRef(0)

  const attach = useCallback(async (target: BendingPdfTarget) => {
    const runId = ++runIdRef.current
    setState({ status: 'attaching', target })
    try {
      const attachment = await attachBendingPdf(target)
      const attachedTarget = { ...target, pdfPath: attachment.path }
      if (runId !== runIdRef.current) return

      if (!attachment.pdf || !isDesktopRuntime()) {
        setState({ path: attachment.path, status: 'attached', target: attachedTarget })
        return
      }

      setState({
        localSave: { status: 'saving' },
        path: attachment.path,
        status: 'attached',
        target: attachedTarget,
      })
      try {
        const saveResult = await savePdfFile(attachment.pdf, `${target.kind}_${target.reference}.pdf`)
        if (runId !== runIdRef.current) return
        setState({
          localSave: saveResult.status === 'saved' ? { path: saveResult.path, status: 'saved' } : undefined,
          path: attachment.path,
          status: 'attached',
          target: attachedTarget,
        })
      } catch (saveError) {
        if (runId === runIdRef.current) {
          setState({
            localSave: {
              error: saveError instanceof Error ? saveError.message : 'The local PDF could not be saved.',
              status: 'failed',
            },
            path: attachment.path,
            status: 'attached',
            target: attachedTarget,
          })
        }
      }
    } catch (error) {
      if (runId === runIdRef.current) {
        setState({
          error: error instanceof Error ? error.message : 'The PDF attachment failed. Please retry.',
          status: 'failed',
          target,
        })
      }
    }
  }, [])

  const retry = useCallback(() => {
    if (state.status === 'failed') void attach(state.target)
  }, [attach, state])

  return { attach, retry, state }
}
