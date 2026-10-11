import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

import { isDesktopRuntime } from '../../../config/platform'

const GUARD_MESSAGE = 'You have an unsaved BOM import in progress. Leaving now will discard the local preview and any unsaved preparation work.'

/**
 * Warns before the user abandons unsaved BOM work: a local parsed preview,
 * an incomplete source attachment, a pending re-import candidate, or an
 * active replacement. Covers in-app route changes, browser reload/close,
 * and — where the Tauri runtime allows — desktop window close.
 */
export function useBomUnsavedGuard(hasUnsavedWork: boolean) {
  const blocker = useBlocker(hasUnsavedWork)

  useEffect(() => {
    if (!hasUnsavedWork) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsavedWork])

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm(GUARD_MESSAGE)) blocker.proceed()
    else blocker.reset()
  }, [blocker])

  useEffect(() => {
    if (!hasUnsavedWork || !isDesktopRuntime()) return
    let unlisten: (() => void) | undefined
    let cancelled = false
    void import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) => {
        if (cancelled) return undefined
        return getCurrentWindow().onCloseRequested((event) => {
          if (!window.confirm(GUARD_MESSAGE)) event.preventDefault()
        })
      })
      .then((stop) => {
        unlisten = stop
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [hasUnsavedWork])
}
