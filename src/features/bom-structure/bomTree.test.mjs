import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const path = fileURLToPath(new URL('./bomTree.ts', import.meta.url))
const { outputFiles } = await build({ entryPoints: [path], bundle: true, format: 'esm', platform: 'node', write: false })
const { getExpandableNodeIds, getSubtreeByNodeId, getVisibleBomNodes } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)

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

function occurrence(id, code, children = []) {
  return {
    ...child,
    id,
    code,
    children,
    isLeaf: children.length === 0,
    level: 1,
  }
}

const deepLeaf = occurrence('deep-leaf', 'D')
const deepChild = occurrence('deep-child', 'C', [deepLeaf])
const branchLeaf = occurrence('branch-leaf', 'E')
const branch = occurrence('branch-a', 'B', [deepChild, branchLeaf])
const outsideSibling = occurrence('outside-sibling', 'F')
const rootA = occurrence('root-a', 'A', [branch, outsideSibling])
const duplicateLeaf = occurrence('duplicate-leaf', 'X')
const duplicateBranch = occurrence('branch-b', 'B', [duplicateLeaf])
const rootB = occurrence('root-b', 'ASSEMBLY-B', [duplicateBranch])
const focusRoots = [rootA, rootB]

test('focused subtree includes its selected occurrence and every descendant through deep leaves', () => {
  const subtree = getSubtreeByNodeId(focusRoots, 'branch-a')
  assert.deepEqual(subtree.map((node) => node.id), ['branch-a'])
  assert.deepEqual(subtree[0].children.map((node) => node.id), ['deep-child', 'branch-leaf'])
  assert.deepEqual(subtree[0].children[0].children.map((node) => node.id), ['deep-leaf'])
  assert.deepEqual([...getExpandableNodeIds(subtree)], ['branch-a', 'deep-child'])
})

test('focused subtree excludes ancestors and siblings outside the selected branch', () => {
  const subtree = getSubtreeByNodeId(focusRoots, 'branch-a')
  const visible = getVisibleBomNodes(subtree, getExpandableNodeIds(subtree), all())
  assert.deepEqual(visible.map(({ node }) => node.id), ['branch-a', 'deep-child', 'deep-leaf', 'branch-leaf'])
  assert.equal(visible.some(({ node }) => node.id === 'root-a' || node.id === 'outside-sibling'), false)
})

test('focusing a leaf returns only that leaf', () => {
  const subtree = getSubtreeByNodeId(focusRoots, 'branch-leaf')
  assert.deepEqual(subtree.map((node) => node.id), ['branch-leaf'])
  assert.deepEqual(subtree[0].children, [])
})

test('focus uses the occurrence ID when a code appears in multiple branches', () => {
  const subtree = getSubtreeByNodeId(focusRoots, 'branch-b')
  assert.equal(subtree[0], duplicateBranch)
  assert.deepEqual(subtree[0].children.map((node) => node.id), ['duplicate-leaf'])
})

test('focused roots leave original tree data and ordering unchanged for full-structure restore', () => {
  const originalChildren = rootA.children.slice()
  const subtree = getSubtreeByNodeId(focusRoots, 'branch-a')
  assert.notEqual(subtree, focusRoots)
  assert.deepEqual(rootA.children, originalChildren)
  assert.deepEqual(focusRoots.map((node) => node.id), ['root-a', 'root-b'])
  assert.deepEqual(subtree[0].children.map((node) => node.id), ['deep-child', 'branch-leaf'])
})

test('existing search and filters remain scoped to the focused branch', () => {
  const subtree = getSubtreeByNodeId(focusRoots, 'branch-a')
  const visible = getVisibleBomNodes(subtree, getExpandableNodeIds(subtree), { ...all(), query: 'D' })
  assert.deepEqual(visible.map(({ node }) => node.id), ['branch-a', 'deep-child', 'deep-leaf'])
  assert.equal(visible.some(({ node }) => node.id === 'duplicate-leaf'), false)
})
