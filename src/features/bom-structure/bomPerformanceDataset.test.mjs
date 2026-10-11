import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const path = fileURLToPath(new URL('./bomPerformanceDataset.ts', import.meta.url))
const { outputFiles } = await build({ entryPoints: [path], bundle: true, format: 'esm', platform: 'node', write: false })
const { BOM_PERFORMANCE_DATASET_SIZES, createBomPerformanceDataset } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)

test('performance fixtures cover the approved safe sizes and contain no source data', () => {
  assert.deepEqual(BOM_PERFORMANCE_DATASET_SIZES, [100, 1000, 5000, 10000])
  const dataset = createBomPerformanceDataset(100)
  assert.equal(dataset.nodes.length, 100)
  assert.equal(dataset.nodes[0].sourceRow, 2)
  assert.match(dataset.nodes[99].code, /^PERF-/)
  assert.ok(dataset.nodes.some((node) => node.reuseCount > 1))
})
