import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

async function load(path) {
  const { outputFiles } = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, format: 'esm', platform: 'node', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)
}

const { buildBomNodeSavePayload } = await load('./mappers/bomSavePayload.ts')
const { canManageBomImports } = await load('../auth/permissions.ts')
const { canReimportCurrentBom, canReplaceCurrentBom } = await load('./bomReplaceGuard.ts')

function parsedBom() {
  const root = { id: 'root', sourceRow: 2, parentId: null, level: 1, code: 'ROOT', position: '', articleType: 'Gruppe', sourceType: 'Eigenfertigung', name: 'Root', name2: '', drawingNumber: '', material: '', quantityPerParent: 1, calculatedCumulativeQuantity: 1, excelCumulativeQuantity: null, positionWeightKg: null, rolledWeightKg: 0, raw: { Stufe: 1, date: new Date('2026-01-01T00:00:00Z') }, formattedRaw: { Stufe: 1 }, itemType: 'assembly' }
  const child = { ...root, id: 'child', sourceRow: 3, parentId: 'root', level: 2, code: 'PART-1', articleType: 'Teil', name: 'Part', name2: 'A', quantityPerParent: 2, calculatedCumulativeQuantity: 2, positionWeightKg: 3, rolledWeightKg: 3, itemType: 'part' }
  return { nodes: [root, child] }
}

test('save payload keeps only persistence fields and converts raw Dates to JSON', () => {
  const payload = buildBomNodeSavePayload(parsedBom())
  assert.equal(payload[1].parent_source_row, 2)
  assert.equal(payload[1].description, 'Part A')
  assert.equal(payload[0].raw_data.date, '2026-01-01T00:00:00.000Z')
  assert.equal('id' in payload[0], false)
})

test('permission and version guards reserve writes for supervisors and admins on the current saved version', () => {
  assert.equal(canManageBomImports('operator'), false)
  assert.equal(canManageBomImports('supervisor'), true)
  const importItem = { id: 'import-1', status: 'saved', parserVersion: 'bom-parser-v1', sourceFileBucket: 'bom-imports', sourceFileName: 'bom.xlsx', sourceFilePath: 'imports/bom.xlsx' }
  assert.equal(canReimportCurrentBom(importItem, 'import-1', true), true)
  assert.equal(canReimportCurrentBom(importItem, 'another-import', true), false)
  assert.equal(canReplaceCurrentBom({ ...importItem, parserVersion: 'older-parser' }, 'import-1', true), false)
})
