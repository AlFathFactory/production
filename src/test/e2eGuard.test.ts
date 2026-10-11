import { describe, expect, test } from 'vitest'

import {
  LIVE_BOM_PROJECT_REF,
  LIVE_OVERRIDE_VALUE,
  gateBomE2E,
  readBomE2EConfig,
  type BomE2EConfig,
} from '../../e2e/guard'

function config(overrides: Partial<BomE2EConfig> = {}): BomE2EConfig {
  return {
    allowLive: '',
    baseUrl: 'http://localhost:5173',
    enabled: true,
    projectRef: 'test-project-ref',
    ...overrides,
  }
}

describe('BOM E2E safety guard', () => {
  test('disabled runs skip with guidance', () => {
    const gate = gateBomE2E(config({ enabled: false }), { destructive: true })
    expect(gate.run).toBe(false)
    if (!gate.run) expect(gate.reason).toMatch(/BOM_E2E_ENABLED/)
  })

  test('missing project ref skips', () => {
    const gate = gateBomE2E(config({ projectRef: '' }), { destructive: true })
    expect(gate.run).toBe(false)
  })

  test('destructive run against live refuses without the explicit override', () => {
    const gate = gateBomE2E(config({ projectRef: LIVE_BOM_PROJECT_REF }), { destructive: true })
    expect(gate.run).toBe(false)
    if (!gate.run) expect(gate.reason).toMatch(/Refusing destructive E2E against live/)
  })

  test('wrong override values still refuse the live run', () => {
    const gate = gateBomE2E(config({ allowLive: 'true', projectRef: LIVE_BOM_PROJECT_REF }), { destructive: true })
    expect(gate.run).toBe(false)
  })

  test('exact override value permits the acknowledged live run', () => {
    const gate = gateBomE2E(config({ allowLive: LIVE_OVERRIDE_VALUE, projectRef: LIVE_BOM_PROJECT_REF }), { destructive: true })
    expect(gate.run).toBe(true)
  })

  test('non-destructive checks may run against live without the override', () => {
    const gate = gateBomE2E(config({ projectRef: LIVE_BOM_PROJECT_REF }), { destructive: false })
    expect(gate.run).toBe(true)
  })

  test('dedicated test projects run destructive flows without override', () => {
    const gate = gateBomE2E(config(), { destructive: true })
    expect(gate.run).toBe(true)
  })

  test('config reader honors environment variables', () => {
    const parsed = readBomE2EConfig({
      BOM_E2E_ALLOW_LIVE: 'x',
      BOM_E2E_BASE_URL: 'http://test:4173',
      BOM_E2E_ENABLED: 'true',
      BOM_E2E_PROJECT_REF: 'ref-1',
    })
    expect(parsed).toMatchObject({ allowLive: 'x', baseUrl: 'http://test:4173', enabled: true, projectRef: 'ref-1' })
    expect(readBomE2EConfig({}).enabled).toBe(false)
  })
})
