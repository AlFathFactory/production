import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

async function importTypeScript(path) {
  const { outputFiles } = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, format: 'esm', platform: 'node', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)
}

const { BOM_PARSER_VERSION } = await importTypeScript('./bomSourceFile.ts')
const { canReimportCurrentBom, canReplaceCurrentBom, downloadBomReplacementSource } = await importTypeScript('./bomReplaceGuard.ts')

function currentImport(parserVersion = BOM_PARSER_VERSION) {
  return {
    id: 'current-import', status: 'saved', parserVersion,
    sourceFileBucket: 'bom-imports', sourceFilePath: 'current-import/source.xlsx', sourceFileName: 'source.xlsx',
  }
}

test('matching parser version allows Replace on the current saved import', async () => {
  const importItem = currentImport()
  const blob = new Blob(['workbook'])
  let downloads = 0
  assert.equal(canReplaceCurrentBom(importItem, importItem.id, true), true)
  assert.equal(await downloadBomReplacementSource(importItem, importItem.id, true, async () => {
    downloads++
    return blob
  }), blob)
  assert.equal(downloads, 1)
})

test('parser mismatch blocks Replace before the download callback can run', async () => {
  const importItem = currentImport(`${BOM_PARSER_VERSION}-legacy`)
  let downloads = 0
  assert.equal(canReplaceCurrentBom(importItem, importItem.id, true), false)
  assert.equal(await downloadBomReplacementSource(importItem, importItem.id, true, async () => {
    downloads++
    return new Blob()
  }), null)
  assert.equal(downloads, 0)
})

test('Re-Import remains available with a parser mismatch', () => {
  const importItem = currentImport(`${BOM_PARSER_VERSION}-legacy`)
  assert.equal(canReimportCurrentBom(importItem, importItem.id, true), true)
  assert.equal(canReplaceCurrentBom(importItem, importItem.id, true), false)
})

test('Replace still requires current status, management access, and attached private source', () => {
  const importItem = currentImport()
  assert.equal(canReplaceCurrentBom(importItem, 'other-import', true), false)
  assert.equal(canReplaceCurrentBom(importItem, importItem.id, false), false)
  assert.equal(canReplaceCurrentBom({ ...importItem, status: 'superseded' }, importItem.id, true), false)
  assert.equal(canReplaceCurrentBom({ ...importItem, sourceFilePath: null }, importItem.id, true), false)
  assert.equal(canReplaceCurrentBom({ ...importItem, sourceFileBucket: 'public' }, importItem.id, true), false)
})
