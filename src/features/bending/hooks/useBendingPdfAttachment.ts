import { useCallback, useRef, useState } from 'react'

import { attachBendingPdf } from '../attachBendingPdf'
import type { BendingPdfTarget } from '../types'

export type BendingPdfAttachmentState =
  | { status: 'idle' }
  | { status: 'attaching'; target: BendingPdfTarget }
  | { path: string; status: 'attached'; target: BendingPdfTarget }
  | { error: string; status: 'failed'; target: BendingPdfTarget }

export function useBendingPdfAttachment() {
  const [state, setState] = useState<BendingPdfAttachmentState>({ status: 'idle' })
  const runIdRef = useRef(0)

  const attach = useCallback(async (target: BendingPdfTarget) => {
    const runId = ++runIdRef.current
    setState({ status: 'attaching', target })
    try {
      const path = await attachBendingPdf(target)
      if (runId === runIdRef.current) setState({ path, status: 'attached', target: { ...target, pdfPath: path } })
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
