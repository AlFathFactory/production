import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const source = fileURLToPath(new URL('./descriptionDimensions.ts', import.meta.url))
const { outputFiles } = await build({ entryPoints: [source], bundle: true, format: 'esm', platform: 'node', write: false })
const { buildDimensionAssignments, extractDimensionTokens } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)

test('builds the backend token contract in description order', () => {
  const description = 'AKT L 5,5/90/100/521'
  assert.deepEqual(extractDimensionTokens(description).map((token) => token.raw), ['5,5', '90', '100', '521'])
  assert.deepEqual(buildDimensionAssignments(description, ['profile', 'length', 'width', 'height']), [
    { token_index: 0, token_raw: '5,5', token_value: 5.5, role: 'profile' },
    { token_index: 1, token_raw: '90', token_value: 90, role: 'length' },
    { token_index: 2, token_raw: '100', token_value: 100, role: 'width' },
    { token_index: 3, token_raw: '521', token_value: 521, role: 'height' },
  ])
})

test('rejects incomplete and duplicate non-unassigned assignments', () => {
  assert.throws(() => buildDimensionAssignments('10/20', ['profile']), /Review every description number/)
  assert.throws(() => buildDimensionAssignments('10/20', ['length', 'length']), /only one number/)
  assert.deepEqual(buildDimensionAssignments('10/20', ['unassigned', 'unassigned']).map((row) => row.role), ['unassigned', 'unassigned'])
})
