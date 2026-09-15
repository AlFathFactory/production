export type Runtime = 'web' | 'desktop'

interface TauriWindow extends Window {
  __TAURI_INTERNALS__?: unknown
}

export function getRuntime(): Runtime {
  if (typeof window === 'undefined') {
    return 'web'
  }

  return (window as TauriWindow).__TAURI_INTERNALS__ ? 'desktop' : 'web'
}

export function isDesktopRuntime(): boolean {
  return getRuntime() === 'desktop'
}

export function isWebRuntime(): boolean {
  return getRuntime() === 'web'
}
