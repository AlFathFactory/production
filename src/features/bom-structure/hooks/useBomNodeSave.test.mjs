import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const hookPath = fileURLToPath(new URL('./useBomNodeSave.ts', import.meta.url))
const { outputFiles } = await build({
  entryPoints: [hookPath],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  plugins: [{
    name: 'hook-dependencies',
    setup(builder) {
      builder.onResolve({ filter: /^(react|@tanstack\/react-query|\.\.\/repositories\/bomRepository|\.\.\/queries\/bomKeys)$/ },
        ({ path }) => ({ path, namespace: 'hook-test' }))
      builder.onLoad({ filter: /.*/, namespace: 'hook-test' }, ({ path }) => ({
        contents: path === 'react'
          ? 'export const useState = (...args) => globalThis.__bomHookTest.useState(...args)'
          : path === '@tanstack/react-query'
            ? 'export const useMutation = (...args) => globalThis.__bomHookTest.useMutation(...args); export const useQueryClient = () => globalThis.__bomHookTest.queryClient'
            : path.endsWith('bomRepository')
              ? 'export const bomRepository = { validateNodes: (...args) => globalThis.__bomHookTest.repository.validateNodes(...args), saveNodes: (...args) => globalThis.__bomHookTest.repository.saveNodes(...args) }'
              : 'export const bomKeys = { import: id => ["bom", "import", id], tree: id => ["bom", "tree", id], summary: id => ["bom", "summary", id], warnings: id => ["bom", "warnings", id], rollups: id => ["bom", "rollups", id] }',
        loader: 'js',
      }))
    },
  }],
})
const { useBomNodeSave } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)

function parsedBom(quantity = 5) {
  return {
    nodes: [{
      id: 'bom-row-2', sourceRow: 2, parentId: null, level: 1, code: 'PART-A',
      position: '', articleType: '', sourceType: '', name: 'Part A', name2: '',
      drawingNumber: '', material: '', quantityPerParent: quantity,
      calculatedCumulativeQuantity: quantity, excelCumulativeQuantity: null,
      positionWeightKg: null, rolledWeightKg: 0, raw: { Menge: quantity },
      formattedRaw: { Menge: quantity }, itemType: 'part',
    }],
  }
}

function harness(warningCount = 0) {
  const states = []
  const calls = { validated: [], saved: [] }
  let cursor = 0
  globalThis.__bomHookTest = {
    useState(initial) {
      const index = cursor++
      if (!(index in states)) states[index] = initial
      return [states[index], (value) => { states[index] = value }]
    },
    useMutation(options) {
      return {
        isPending: false,
        error: null,
        reset() { this.error = null },
        async mutateAsync(input) {
          await options.onMutate?.(input)
          try {
            const result = await options.mutationFn(input)
            await options.onSuccess?.(result)
            return result
          } catch (error) {
            this.error = error
            await options.onError?.(error)
            throw error
          }
        },
      }
    },
    queryClient: { invalidateQueries: async () => undefined },
    repository: {
      async validateNodes(payload) {
        calls.validated.push(payload)
        return {
          isValid: true, nodeCount: payload.length, rootCount: 1,
          errorCount: 0, warningCount, errors: [], warnings: [],
        }
      },
      async saveNodes(payload) {
        calls.saved.push(payload)
        return { importId: payload.p_bom_import_id, insertedCount: payload.p_nodes.length, warningCount, status: 'saved' }
      },
    },
  }
  return {
    calls,
    render() { cursor = 0; return useBomNodeSave() },
  }
}

test('save sends the exact payload reviewed by validation even after parsed data changes', async () => {
  const { calls, render } = harness()
  const parsed = parsedBom(5)
  await render().validateMutation.mutateAsync({ importId: 'import-a', parsed })
  parsed.nodes[0].quantityPerParent = 20
  parsed.nodes[0].raw.Menge = 20
  await render().saveMutation.mutateAsync({ importId: 'import-a' })
  assert.equal(calls.saved[0].p_nodes, calls.validated[0])
  assert.equal(calls.saved[0].p_nodes[0].quantity_per_parent, 5)
  assert.equal(calls.saved[0].p_nodes[0].raw_data.Menge, 5)
})

test('reset and a different import ID cannot reuse validation', async () => {
  const { calls, render } = harness()
  await render().validateMutation.mutateAsync({ importId: 'import-a', parsed: parsedBom() })
  await assert.rejects(render().saveMutation.mutateAsync({ importId: 'import-b' }), /Validate this workbook/)
  render().reset()
  await assert.rejects(render().saveMutation.mutateAsync({ importId: 'import-a' }), /Validate this workbook/)
  assert.equal(calls.saved.length, 0)
})

test('backend warnings still require acknowledgment', async () => {
  const { calls, render } = harness(1)
  await render().validateMutation.mutateAsync({ importId: 'import-a', parsed: parsedBom() })
  await assert.rejects(render().saveMutation.mutateAsync({ importId: 'import-a' }), /Acknowledge the backend warnings/)
  render().setAcknowledgedWarnings(true)
  await render().saveMutation.mutateAsync({ importId: 'import-a' })
  assert.equal(calls.saved.length, 1)
})

test('validating another import clears the previous payload when validation fails', async () => {
  const { calls, render } = harness()
  await render().validateMutation.mutateAsync({ importId: 'import-a', parsed: parsedBom() })
  globalThis.__bomHookTest.repository.validateNodes = async () => ({
    isValid: false, nodeCount: 1, rootCount: 1, errorCount: 1,
    warningCount: 0, errors: [{ kind: 'invalid', message: 'Invalid node', sourceRow: 2 }], warnings: [],
  })
  await render().validateMutation.mutateAsync({ importId: 'import-b', parsed: parsedBom() })
  await assert.rejects(render().saveMutation.mutateAsync({ importId: 'import-a' }), /Validate this workbook/)
  await assert.rejects(render().saveMutation.mutateAsync({ importId: 'import-b' }), /Validate this workbook/)
  assert.equal(calls.saved.length, 0)
})

test('an uncertain save error is surfaced without an automatic retry', async () => {
  const { render } = harness()
  await render().validateMutation.mutateAsync({ importId: 'import-a', parsed: parsedBom() })
  let attempts = 0
  globalThis.__bomHookTest.repository.saveNodes = async () => {
    attempts++
    throw new Error('Network response unknown')
  }
  await assert.rejects(render().saveMutation.mutateAsync({ importId: 'import-a' }), /Network response unknown/)
  assert.equal(attempts, 1)
})
