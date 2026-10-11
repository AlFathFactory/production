import { expect, test, type Page } from '@playwright/test'

import { buildSyntheticBomWorkbook } from './fixtures'
import { gateBomE2E, readBomE2EConfig, type BomE2EConfig } from './guard'

/**
 * Task 78 — BOM happy path on a disposable project/lot with synthetic data.
 * Env-gated; see e2e/guard.ts. Requires a running web build plus test users:
 *   BOM_E2E_ENABLED=true
 *   BOM_E2E_PROJECT_REF=<dedicated-test-project-ref>
 *   BOM_E2E_SUPERVISOR_EMAIL / BOM_E2E_SUPERVISOR_PASSWORD
 *   BOM_E2E_PROJECT_ID / BOM_E2E_PROJECT_NUMBER_ID / BOM_E2E_LOT_ID (disposable)
 */

const __gate = gateBomE2E(readBomE2EConfig(), { destructive: true })
test.skip(!__gate.run, __gate.run ? 'BOM E2E enabled.' : __gate.reason)

function requireDestructiveConfig(): BomE2EConfig {
  return (__gate as { config: BomE2EConfig }).config
}

async function loginAsSupervisor(page: Page, config: BomE2EConfig) {
  const email = process.env.BOM_E2E_SUPERVISOR_EMAIL
  const password = process.env.BOM_E2E_SUPERVISOR_PASSWORD
  if (!email || !password) test.skip(true, 'BOM E2E skipped: supervisor test credentials are not set.')
  await page.goto(`${config.baseUrl}/login`)
  await page.getByLabel(/work email/i).fill(email as string)
  await page.getByLabel(/password/i).fill(password as string)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await expect(page).not.toHaveURL(/login/, { timeout: 30_000 })
}

test.describe('BOM happy path (disposable data only)', () => {
  test('supervisor imports, saves, re-imports, and extracts a synthetic BOM', async ({ page }) => {
    const config = requireDestructiveConfig()
    const projectId = process.env.BOM_E2E_PROJECT_ID
    const projectNumberId = process.env.BOM_E2E_PROJECT_NUMBER_ID
    const lotId = process.env.BOM_E2E_LOT_ID
    if (!projectId || !projectNumberId || !lotId) {
      test.skip(true, 'BOM E2E skipped: disposable BOM_E2E_PROJECT_ID/NUMBER_ID/LOT_ID are not set.')
      return
    }

    await loginAsSupervisor(page, config)
    await page.goto(`${config.baseUrl}/bom-structure`)
    await expect(page.getByRole('heading', { name: /bom structure explorer/i })).toBeVisible()

    // Upload a synthetic workbook and wait for the local parse.
    const workbook = buildSyntheticBomWorkbook(Date.now().toString(36))
    await page.getByLabel(/excel|workbook|bom file/i).first().setInputFiles({
      buffer: workbook,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: 'e2e-bom.xlsx',
    })
    await expect(page.getByText(/header detected at excel row/i)).toBeVisible({ timeout: 30_000 })

    // Project hierarchy is selected during import preparation.
    await page.getByLabel(/project \*/i).first().selectOption(projectId as string)

    // Validate, attach, and save the structure.
    await page.getByRole('button', { name: /create import and attach workbook/i }).click()
    await expect(page.getByText(/source workbook attached/i)).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: /^validate nodes$/i }).click()
    await expect(page.getByText(/backend validation (passed|failed)/i)).toBeVisible({ timeout: 60_000 })
    const acknowledged = page.getByLabel(/i reviewed the backend warnings/i)
    if (await acknowledged.isVisible().catch(() => false)) await acknowledged.check()
    await page.getByRole('button', { name: /save bom structure/i }).click()
    await expect(page.getByText(/saved import v\d+/i)).toBeVisible({ timeout: 60_000 })

    // Reloaded persisted tree supports search, node details, and mapping.
    await page.getByPlaceholder(/code, description, material/i).fill('E2E-PART-A')
    await expect(page.getByText(/matches ·/i)).toBeVisible()
    await page.getByRole('treeitem').first().click()
    await expect(page.getByText(/node details/i)).toBeVisible()

    // Re-import keeps the saved version current until the candidate saves.
    await page.getByRole('button', { name: /re-import/i }).click()
    await expect(page.getByText(/remains current until this candidate/i)).toBeVisible()

    // Extraction preview assigns routes, confirms, and extracts.
    await page.getByRole('tab', { name: /extraction preview/i }).click()
    const routeSelects = page.getByLabel(/route for e2e-part/i)
    const selectCount = await routeSelects.count()
    expect(selectCount).toBeGreaterThan(0)
    for (let index = 0; index < selectCount; index += 1) {
      await routeSelects.nth(index).selectOption('BEND')
    }
    await page.getByLabel(/i confirm extraction/i).check()
    await page.getByRole('button', { name: /extract to production/i }).click()
    await expect(page.getByText(/extraction .* created/i)).toBeVisible({ timeout: 60_000 })

    // Ledger shows the completed extraction; production reflects new items.
    await expect(page.getByText(/already extracted|created, 0 skipped/i)).toBeVisible({ timeout: 30_000 })
  })
})
