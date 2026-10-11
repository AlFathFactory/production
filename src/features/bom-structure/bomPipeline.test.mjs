import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

async function importTypeScript(path) {
  const { outputFiles } = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, format: 'esm', platform: 'node', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)
}

const { buildBomPipelineStages, isBomPipelineActive } = await importTypeScript('./bomPipeline.ts')

function idleInput(overrides = {}) {
  return {
    isParsing: false,
    parseError: null,
    hasParsed: false,
    preparationStage: 'idle',
    preparationError: null,
    sourceUploaded: false,
    preparationComplete: false,
    isValidating: false,
    validationError: null,
    hasValidation: false,
    isSaving: false,
    saveError: null,
    hasSaved: false,
    isRefreshing: false,
    isPersisted: false,
    ...overrides,
  }
}

function stateOf(stages, key) {
  return stages.find((stage) => stage.key === key).state
}

test('idle pipeline reports every stage as pending and inactive', () => {
  const stages = buildBomPipelineStages(idleInput())
  assert.equal(stages.length, 8)
  assert.deepEqual(stages.map((stage) => stage.label), ['Parsing', 'Validating', 'Creating Import', 'Uploading File', 'Attaching Metadata', 'Saving Structure', 'Refreshing Data', 'Complete'])
  assert.ok(stages.every((stage) => stage.state === 'pending'))
  assert.equal(isBomPipelineActive(stages), false)
})

test('upload failure marks uploading failed while the created import stays done', () => {
  const stages = buildBomPipelineStages(idleInput({
    hasParsed: true,
    preparationStage: 'uploading',
    preparationError: 'Storage upload failed.',
    sourceUploaded: false,
  }))
  assert.equal(stateOf(stages, 'parsing'), 'done')
  assert.equal(stateOf(stages, 'creating'), 'done')
  assert.equal(stateOf(stages, 'uploading'), 'failed')
  assert.equal(stateOf(stages, 'attaching'), 'pending')
  assert.equal(isBomPipelineActive(stages), true)
})

test('completed save with persisted tree completes the pipeline', () => {
  const stages = buildBomPipelineStages(idleInput({
    hasParsed: true,
    preparationStage: 'complete',
    preparationComplete: true,
    sourceUploaded: true,
    hasValidation: true,
    hasSaved: true,
    isPersisted: true,
  }))
  for (const key of ['parsing', 'validating', 'creating', 'uploading', 'attaching', 'saving', 'refreshing', 'complete']) {
    assert.equal(stateOf(stages, key), 'done')
  }
})

test('ambiguous save error blocks at the saving stage', () => {
  const stages = buildBomPipelineStages(idleInput({
    hasParsed: true,
    preparationStage: 'complete',
    preparationComplete: true,
    sourceUploaded: true,
    hasValidation: true,
    saveError: 'The save response needs review. Reload the import before retrying.',
  }))
  assert.equal(stateOf(stages, 'saving'), 'failed')
  assert.equal(stateOf(stages, 'complete'), 'pending')
})
