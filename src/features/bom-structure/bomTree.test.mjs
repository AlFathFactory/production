import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const path = fileURLToPath(new URL('./bomTree.ts', import.meta.url))
const { outputFiles } = await build({ entryPoints: [path], bundle: true, format: 'esm', platform: 'node', write: false })
const { getVisibleBomNodes } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)

const child = { id: 'part', level: 2, sourceRow: 3, code: 'PART-1', itemType: 'part', sourceType: 'Fremdbezug', name: 'Part', name2: '', description: '10 x 20', material: 'S355', drawingNumber: '', isLeaf: true, reuseCount: 2, children: [] }
const root = { id: 'root', level: 1, sourceRow: 2, code: 'ROOT', itemType: 'assembly', sourceType: 'Eigenfertigung', name: 'Root', name2: '', description: '', material: '', drawingNumber: '', isLeaf: false, reuseCount: 1, children: [child] }
const all = () => ({ itemTypes: new Set(['assembly', 'part', 'material']), level: null, leafOnly: false, query: '', reusedOnly: false, sourceRowsWithWarnings: new Set(), sourceTypes: new Set(['Eigenfertigung', 'Fremdbezug']), unmappedDimensionCodes: new Set(), unmappedDimensionsOnly: false, warningsOnly: false })

test('filter criteria retain ancestors while highlighting only direct matches', () => {
  const visible = getVisibleBomNodes([root], new Set(), { ...all(), reusedOnly: true })
  assert.deepEqual(visible.map(({ node }) => node.id), ['root', 'part'])
  assert.deepEqual(visible.map(({ isMatch }) => isMatch), [false, true])
})

test('level, warning, and unmapped dimension filters are intersected', () => {
  const visible = getVisibleBomNodes([root], new Set(), {
    ...all(), level: 2, warningsOnly: true, sourceRowsWithWarnings: new Set([3]), unmappedDimensionsOnly: true, unmappedDimensionCodes: new Set(['PART-1']),
  })
  assert.equal(visible.length, 2)
  assert.equal(visible[1].node.id, 'part')
  assert.equal(visible[1].isMatch, true)
})
