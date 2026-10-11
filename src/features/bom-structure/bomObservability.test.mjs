import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const { outputFiles } = await build({ entryPoints: [fileURLToPath(new URL('./bomObservability.ts', import.meta.url))], bundle: true, format: 'esm', platform: 'node', write: false })
const { reportBomError } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)

test('BOM diagnostics classify errors without emitting workbook data or server messages', () => {
  const emitted = []
  const previous = console.error
  console.error = (...args) => emitted.push(args)
  try {
    const event = reportBomError('upload', { code: '42501', message: 'permission denied for customer-secret.xlsx', payload: { article: 'PRIVATE' } })
    assert.equal(event.category, 'permission')
    assert.equal(event.code, '42501')
    assert.equal(reportBomError('rpc', { code: 'PRIVATE', message: 'server data' }).code, null)
    assert.deepEqual(Object.keys(event), ['area', 'category', 'code', 'at'])
    assert.equal(JSON.stringify(emitted).includes('customer-secret'), false)
    assert.equal(JSON.stringify(emitted).includes('PRIVATE'), false)
  } finally {
    console.error = previous
  }
})
