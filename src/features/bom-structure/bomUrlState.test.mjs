import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const path = fileURLToPath(new URL('./bomUrlState.ts', import.meta.url))
const { outputFiles } = await build({ entryPoints: [path], bundle: true, format: 'esm', platform: 'node', write: false })
const { readBomWorkspaceUrl, writeBomWorkspaceUrl } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)

test('workspace URL restores import, selection, focused branch, tab, query, and filters', () => {
  const state = readBomWorkspaceUrl(new URLSearchParams('bomImportId=import-1&bomNodeId=node-9&focused_node=node-5&bomTab=extraction&bomQuery=bracket&bomItemTypes=part&bomSourceTypes=Fremdbezug&bomLevel=3&bomLeaf=1&bomReused=1&bomWarnings=1&bomUnmappedDimensions=1'))
  assert.equal(state.importId, 'import-1')
  assert.equal(state.nodeId, 'node-9')
  assert.equal(state.focusedNodeId, 'node-5')
  assert.equal(state.tab, 'extraction')
  assert.equal(state.filters.level, 3)
  assert.deepEqual([...state.filters.itemTypes], ['part'])
  assert.equal(state.filters.warningsOnly, true)
})

test('workspace URL omits defaults and preserves unrelated route parameters', () => {
  const state = readBomWorkspaceUrl(new URLSearchParams())
  const result = writeBomWorkspaceUrl(new URLSearchParams('page=2'), { ...state, focusedNodeId: 'node-5', importId: 'import-1', query: '  plate  ' })
  assert.equal(result.toString(), 'page=2&focused_node=node-5&bomImportId=import-1&bomQuery=plate')
})

test('an intentionally empty item-type selection remains empty after a refresh', () => {
  const state = readBomWorkspaceUrl(new URLSearchParams('bomItemTypes=none'))
  assert.equal(state.filters.itemTypes.size, 0)
  assert.equal(writeBomWorkspaceUrl(new URLSearchParams(), state).get('bomItemTypes'), 'none')
})
