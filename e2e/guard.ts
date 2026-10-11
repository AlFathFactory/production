/**
 * Safety guard for BOM Playwright E2E (Tasks 78–79).
 *
 * E2E never runs implicitly. Requirements to run:
 *   BOM_E2E_ENABLED=true
 *   BOM_E2E_PROJECT_REF=<dedicated-test-project-ref>
 *
 * If BOM_E2E_PROJECT_REF points at the live Production Control project
 * (gsiibqwmoqtamruilvec), destructive specs additionally require:
 *   BOM_E2E_ALLOW_LIVE=I-UNDERSTAND-THIS-RUNS-AGAINST-LIVE
 *
 * Prefer a separate Supabase test project. Without the flags every spec
 * skips safely: tests are discovered and reported as skipped, no browser
 * action runs, and no data is touched.
 */

export const LIVE_BOM_PROJECT_REF = 'gsiibqwmoqtamruilvec'
export const LIVE_OVERRIDE_VALUE = 'I-UNDERSTAND-THIS-RUNS-AGAINST-LIVE'

export interface BomE2EConfig {
  allowLive: string
  baseUrl: string
  enabled: boolean
  projectRef: string
}

export function readBomE2EConfig(env: Record<string, string | undefined> = process.env): BomE2EConfig {
  return {
    allowLive: env.BOM_E2E_ALLOW_LIVE ?? '',
    baseUrl: env.BOM_E2E_BASE_URL ?? 'http://localhost:5173',
    enabled: env.BOM_E2E_ENABLED === 'true',
    projectRef: env.BOM_E2E_PROJECT_REF ?? '',
  }
}

export type BomE2EGate =
  | { config: BomE2EConfig; reason: null; run: true }
  | { config: BomE2EConfig; reason: string; run: false }

export function gateBomE2E(config: BomE2EConfig, options: { destructive: boolean }): BomE2EGate {
  if (!config.enabled) {
    return { config, reason: 'BOM E2E disabled: set BOM_E2E_ENABLED=true to run.', run: false }
  }
  if (!config.projectRef) {
    return { config, reason: 'BOM E2E skipped: BOM_E2E_PROJECT_REF is not set.', run: false }
  }
  if (config.projectRef === LIVE_BOM_PROJECT_REF && options.destructive && config.allowLive !== LIVE_OVERRIDE_VALUE) {
    return {
      config,
      reason: `Refusing destructive E2E against live project ${LIVE_BOM_PROJECT_REF} without BOM_E2E_ALLOW_LIVE=${LIVE_OVERRIDE_VALUE}.`,
      run: false,
    }
  }
  return { config, reason: null, run: true }
}
