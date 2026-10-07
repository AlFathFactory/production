import type { WorkBook, WorkSheet } from 'xlsx'

import type {
  BomItemType,
  BomNode,
  BomParseResult,
  BomRawRow,
  BomRawValue,
  BomWarning,
  RolledUpBomPart,
} from './types'

type GridRow = BomRawValue[]

export class BomWorkbookError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BomWorkbookError'
  }
}

function toGrid(sheet: WorkSheet, xlsx: typeof import('xlsx'), raw: boolean): GridRow[] {
  return xlsx.utils.sheet_to_json<GridRow>(sheet, {
    blankrows: true,
    defval: null,
    header: 1,
    raw,
  })
}

function text(value: BomRawValue | undefined): string {
  return value === null || value === undefined ? '' : String(value).trim()
}

export function normalizeBomCode(value: BomRawValue | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(value)
  }
  const normalized = String(value).trim()
  return /^[-+]?\d+\.0+$/.test(normalized) ? normalized.replace(/\.0+$/, '') : normalized
}

function numberValue(value: BomRawValue | undefined): number | null {
  if (value === null || value === undefined || text(value) === '') return null
  const parsed = typeof value === 'number' ? value : Number(String(value).trim().replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function itemType(sourceValue: string): BomItemType {
  if (sourceValue === 'Gruppe') return 'assembly'
  if (sourceValue === 'Teil') return 'part'
  if (sourceValue === 'Werkstoff') return 'material'
  return 'unknown'
}

function rowObject(headers: string[], row: GridRow): BomRawRow {
  const result: BomRawRow = {}
  headers.forEach((header, index) => {
    if (header) result[header] = row[index] ?? null
  })
  return result
}

function addWarning(
  warnings: BomWarning[],
  kind: BomWarning['kind'],
  sourceRow: number,
  code: string | null,
  message: string,
) {
  warnings.push({ code, kind, message, sourceRow })
}

function unitWeightOf(leaf: BomNode): number | null {
  // Positionsgewicht is the weight of the whole Excel row (for its Menge),
  // so the per-piece weight is the row weight divided by the row quantity.
  if (leaf.positionWeightKg === null || leaf.quantityPerParent === 0) return null
  return leaf.positionWeightKg / leaf.quantityPerParent
}

function rollUpLeaves(leaves: BomNode[]): RolledUpBomPart[] {
  const groups = new Map<string, RolledUpBomPart>()
  for (const leaf of leaves) {
    const key = leaf.code || `(blank code, row ${leaf.sourceRow})`
    const existing = groups.get(key)
    if (existing) {
      existing.totalQuantity += leaf.calculatedCumulativeQuantity
      existing.totalWeightKg += leaf.rolledWeightKg
    } else {
      groups.set(key, {
        code: leaf.code,
        description: leaf.name,
        material: leaf.material,
        totalQuantity: leaf.calculatedCumulativeQuantity,
        totalWeightKg: leaf.rolledWeightKg,
        unitWeightKg: unitWeightOf(leaf),
      })
    }
  }
  return [...groups.values()].sort((left, right) =>
    right.totalWeightKg - left.totalWeightKg || left.code.localeCompare(right.code),
  )
}

function buildResult(grid: GridRow[], formattedGrid: GridRow[], sheetName: string): BomParseResult {
  if (grid.length === 0) {
    throw new BomWorkbookError('The selected workbook is empty.')
  }

  const headerIndex = grid.findIndex((row) => row.some((cell) => text(cell) === 'Stufe'))
  if (headerIndex < 0) {
    throw new BomWorkbookError("Could not detect a BOM structure header. The 'Stufe' column was not found.")
  }

  const headers = grid[headerIndex].map((value) => text(value))
  const mappedRows = grid.slice(headerIndex + 1).flatMap((row, offset) => {
    const raw = rowObject(headers, row)
    const formattedRaw = rowObject(headers, formattedGrid[headerIndex + offset + 1] ?? [])
    return text(raw.Stufe) ? [{ formattedRaw, raw, sourceRow: headerIndex + offset + 2 }] : []
  })
  if (mappedRows.length === 0) {
    throw new BomWorkbookError("The BOM header was found, but there are no rows with a 'Stufe' value.")
  }

  const warnings: BomWarning[] = []
  const nodes: BomNode[] = []
  const roots: BomNode[] = []
  const stack: Array<BomNode | undefined> = []

  for (const { formattedRaw, raw, sourceRow } of mappedRows) {
    const parsedLevel = numberValue(raw.Stufe)
    if (parsedLevel === null || !Number.isInteger(parsedLevel) || parsedLevel < 1) {
      addWarning(warnings, 'invalid-level', sourceRow, null, `Invalid Stufe value: ${text(raw.Stufe) || 'blank'}. Row was skipped.`)
      continue
    }

    const level = parsedLevel
    const code = normalizeBomCode(level === 1 ? raw.Artikel : raw.Komponente)
    if (!code) addWarning(warnings, 'empty-code', sourceRow, null, 'Node code is empty.')

    const rawQuantity = numberValue(raw.Menge)
    const quantityPerParent = rawQuantity ?? 1
    if (text(raw.Menge) && rawQuantity === null) {
      addWarning(warnings, 'invalid-quantity', sourceRow, code || null, `Invalid Menge value: ${text(raw.Menge)}. Quantity 1 was used.`)
    }
    if (quantityPerParent < 0) {
      addWarning(warnings, 'negative-quantity', sourceRow, code || null, `Menge is negative (${quantityPerParent}).`)
    }

    const rawWeight = numberValue(raw.Positionsgewicht)
    if (text(raw.Positionsgewicht) && (rawWeight === null || rawWeight < 0)) {
      addWarning(warnings, 'invalid-weight', sourceRow, code || null, `Invalid Positionsgewicht value: ${text(raw.Positionsgewicht)}.`)
    }

    stack.length = level
    const parent = level > 1 ? stack[level - 1] : undefined
    if (level > 1 && !parent) {
      addWarning(warnings, 'hierarchy-jump', sourceRow, code || null, `Level ${level} has no available level ${level - 1} parent.`)
    }

    const calculatedCumulativeQuantity = level === 1
      ? 1
      : (parent?.calculatedCumulativeQuantity ?? 1) * quantityPerParent
    const excelCumulativeQuantity = numberValue(raw['Menge/kumuliert'])
    const positionWeightKg = rawWeight
    const node: BomNode = {
      articleType: text(raw.Artikelart),
      calculatedCumulativeQuantity,
      children: [],
      code,
      drawingNumber: text(raw['Komp.Z.Din-Nr']),
      excelCumulativeQuantity,
      formattedRaw,
      id: `bom-row-${sourceRow}`,
      isLeaf: true,
      itemType: itemType(text(raw.Artikelart)),
      level,
      material: text(raw.Werkstoff),
      name: text(raw['Komp.Bezeichnung']),
      name2: text(raw['Bezeichnung 2']),
      parentCode: parent?.code ?? null,
      parentId: parent?.id ?? null,
      position: normalizeBomCode(raw.Position),
      positionWeightKg,
      quantityPerParent,
      raw,
      reuseCount: 1,
      rolledWeightKg: (positionWeightKg ?? 0) * (parent?.calculatedCumulativeQuantity ?? 1),
      sourceRow,
      sourceType: text(raw['Beschaff.Kenng']),
    }

    if (parent) {
      parent.children.push(node)
      parent.isLeaf = false
    } else {
      roots.push(node)
    }
    stack[level] = node
    nodes.push(node)

    if (excelCumulativeQuantity !== null && Math.abs(excelCumulativeQuantity - calculatedCumulativeQuantity) > 0.000001) {
      addWarning(
        warnings,
        'cumulative-mismatch',
        sourceRow,
        code || null,
        `Excel cumulative is ${excelCumulativeQuantity}; calculated cumulative is ${calculatedCumulativeQuantity}.`,
      )
    }
  }

  const levelOneRoots = nodes.filter((node) => node.level === 1)
  if (levelOneRoots.length === 0) {
    addWarning(warnings, 'no-root', headerIndex + 2, null, 'No Level 1 root was found.')
  } else if (levelOneRoots.length > 1) {
    levelOneRoots.slice(1).forEach((node) => {
      addWarning(warnings, 'multiple-roots', node.sourceRow, node.code || null, 'Multiple Level 1 roots were found.')
    })
  }

  const byCode = new Map<string, BomNode[]>()
  nodes.forEach((node) => {
    if (!node.code) return
    const occurrences = byCode.get(node.code) ?? []
    occurrences.push(node)
    byCode.set(node.code, occurrences)
  })
  nodes.forEach((node) => {
    node.reuseCount = node.code ? (byCode.get(node.code)?.length ?? 1) : 1
  })

  const leaves = nodes.filter((node) => node.isLeaf)
  const maxLevel = nodes.reduce((maximum, node) => Math.max(maximum, node.level), 0)
  const summary = {
    assemblies: nodes.filter((node) => node.itemType === 'assembly').length,
    leafItems: leaves.length,
    levels: maxLevel,
    materials: nodes.filter((node) => node.itemType === 'material').length,
    parts: nodes.filter((node) => node.itemType === 'part').length,
    rootCode: levelOneRoots[0]?.code ?? roots[0]?.code ?? '',
    rows: nodes.length,
    totalCalculatedLeafMassKg: leaves.reduce((total, node) => total + node.rolledWeightKg, 0),
    uniqueCodes: byCode.size,
  }

  return {
    byCode,
    headerRow: headerIndex + 1,
    leaves,
    nodes,
    rolledUpParts: rollUpLeaves(leaves),
    root: levelOneRoots[0] ?? roots[0] ?? null,
    roots,
    sheetName,
    summary,
    warnings,
  }
}

export async function parseBomWorkbook(data: ArrayBuffer): Promise<BomParseResult> {
  let workbook: WorkBook
  let xlsx: typeof import('xlsx')
  try {
    xlsx = await import('xlsx')
    workbook = xlsx.read(data, {
      bookVBA: false,
      cellDates: true,
      cellFormula: false,
      type: 'array',
    })
  } catch {
    throw new BomWorkbookError('The selected file is not a readable Excel workbook.')
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new BomWorkbookError('The selected workbook does not contain any sheets.')
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) throw new BomWorkbookError('The first worksheet could not be read.')
  return buildResult(toGrid(sheet, xlsx, true), toGrid(sheet, xlsx, false), sheetName)
}
