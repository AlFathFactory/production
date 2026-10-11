import { defineConfig } from '@playwright/test'

export default defineConfig({
  fullyParallel: true,
  reporter: 'list',
  testDir: 'e2e',
  timeout: 120_000,
  use: {
    baseURL: process.env.BOM_E2E_BASE_URL ?? 'http://localhost:5173',
  },
})
