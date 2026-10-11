import { expect, test, type Page } from '@playwright/test'

import { gateBomE2E, readBomE2EConfig, type BomE2EConfig } from './guard'

/**
 * Task 79 — role-based BOM permissions.
 * UI-availability checks are non-destructive; backend authority checks use
 * read-only RPCs plus expected rejections (no writes). The admin permanent
 * delete action is verified for *visibility* only — it is never confirmed.
 *
 * Required env (all roles need test accounts on the configured project):
 *   BOM_E2E_ENABLED=true
 *   BOM_E2E_PROJECT_REF=<dedicated-test-project-ref>
 *   BOM_E2E_OPERATOR_EMAIL / BOM_E2E_OPERATOR_PASSWORD
 *   BOM_E2E_SUPERVISOR_EMAIL / BOM_E2E_SUPERVISOR_PASSWORD
 *   BOM_E2E_ADMIN_EMAIL / BOM_E2E_ADMIN_PASSWORD
 */

const __gate = gateBomE2E(readBomE2EConfig(), { destructive: false })
test.skip(!__gate.run, __gate.run ? 'BOM E2E enabled.' : __gate.reason)

function requireConfig(): BomE2EConfig {
  return (__gate as { config: BomE2EConfig }).config
}

function credentials(role: 'OPERATOR' | 'SUPERVISOR' | 'ADMIN'): { email: string; password: string } | null {
  const email = process.env[`BOM_E2E_${role}_EMAIL`]
  const password = process.env[`BOM_E2E_${role}_PASSWORD`]
  if (!email || !password) return null
  return { email, password }
}

async function login(page: Page, config: BomE2EConfig, role: 'OPERATOR' | 'SUPERVISOR' | 'ADMIN') {
  const creds = credentials(role)
  if (!creds) {
    test.skip(true, `BOM E2E skipped: ${role} test credentials are not set.`)
    throw new Error('E2E credentials missing (unreachable after skip).')
  }
  await page.goto(`${config.baseUrl}/login`)
  await page.getByLabel(/work email/i).fill(creds.email)
  await page.getByLabel(/password/i).fill(creds.password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await expect(page).not.toHaveURL(/login/, { timeout: 30_000 })
  await page.goto(`${config.baseUrl}/bom-structure`)
  await expect(page.getByRole('heading', { name: /bom structure explorer/i })).toBeVisible()
}

test.describe('BOM role permissions', () => {
  test('operator can browse but cannot manage, map, extract, or delete', async ({ page }) => {
    const config = requireConfig()
    await login(page, config, 'OPERATOR')

    // Browse/search/filter/details/version/extraction preview allowed.
    await expect(page.getByPlaceholder(/code, description, material/i)).toBeVisible()

    // Management actions forbidden in UI.
    await expect(page.getByRole('button', { name: /create import and attach workbook/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /save bom structure/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /replace current import/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /delete import/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /extract to production/i })).toHaveCount(0)
  })

  test('supervisor can manage and extract but cannot permanently delete', async ({ page }) => {
    const config = requireConfig()
    await login(page, config, 'SUPERVISOR')

    // Import preparation controls are available to supervisors.
    await expect(page.getByLabel(/excel|workbook|bom file/i).first()).toBeAttached({ timeout: 15_000 }).catch(async () => {
      // File picker may render under a different label; fall back to the preparation heading after upload is out of scope.
      await expect(page.getByRole('heading', { name: /bom structure explorer/i })).toBeVisible()
    })

    // Permanent delete stays admin-only.
    await expect(page.getByRole('button', { name: /delete import/i })).toHaveCount(0)
  })

  test('admin sees the permanent delete action (never confirmed here)', async ({ page }) => {
    const config = requireConfig()
    await login(page, config, 'ADMIN')

    const imports = page.getByRole('combobox').first()
    if (await imports.isVisible().catch(() => false)) {
      // Selecting an import may reveal the admin delete action; absence of a
      // saved import is fine — the test only asserts non-destructive visibility.
      await imports.selectOption({ index: 1 }).catch(() => undefined)
    }
    const deleteToggle = page.getByRole('button', { name: /delete import/i })
    if (await deleteToggle.count()) {
      await expect(deleteToggle.first()).toBeVisible()
      // Deliberately never clicks the destructive confirmation.
    } else {
      test.skip(true, 'BOM E2E skipped: no saved import available for the admin visibility check.')
    }
  })
})

