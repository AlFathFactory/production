import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

async function importTypeScript(path) {
  const { outputFiles } = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, format: 'esm', platform: 'node', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)
}

const { getBomRecoveryAdvice } = await importTypeScript('./bomRecovery.ts')

function idleInput(overrides = {}) {
  return {
    preparationStage: 'idle',
    preparationError: null,
    hasAttempt: false,
    sourceUploaded: false,
    saveError: null,
    replaceError: null,
    extractionError: null,
    ...overrides,
  }
}

test('no failure yields no recovery advice', () => {
  assert.equal(getBomRecoveryAdvice(idleInput()), null)
})

test('failed upload with an existing attempt reuses the same import record', () => {
  const advice = getBomRecoveryAdvice(idleInput({
    preparationStage: 'uploading',
    preparationError: 'Storage upload failed.',
    hasAttempt: true,
    sourceUploaded: false,
  }))
  assert.ok(advice)
  assert.match(advice.message, /same import record/)
})

test('failed attach after upload keeps the same import record', () => {
  const advice = getBomRecoveryAdvice(idleInput({
    preparationStage: 'attaching',
    preparationError: 'Source attachment failed.',
    hasAttempt: true,
    sourceUploaded: true,
  }))
  assert.ok(advice)
  assert.match(advice.message, /do not start a new import/i)
})

test('ambiguous save outcome asks for a reopen before retry', () => {
  const advice = getBomRecoveryAdvice(idleInput({
    saveError: 'The save response needs review. Reload the import before retrying.',
  }))
  assert.ok(advice)
  assert.match(advice.message, /Reopen this import/i)
})

test('extraction failure points at the ledger status check', () => {
  const advice = getBomRecoveryAdvice(idleInput({ extractionError: 'duplicate article' }))
  assert.ok(advice)
  assert.match(advice.message, /extraction status/i)
})
