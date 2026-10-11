import type { BomNode, BomParseResult } from './types'

export const BOM_PERFORMANCE_DATASET_SIZES = [100, 1_000, 5_000, 10_000] as const
export type BomPerformanceDatasetSize = typeof BOM_PERFORMANCE_DATASET_SIZES[number]

function nodeAt(index: number, parent: BomNode | null): BomNode {
  const level = parent ? parent.level + 1 : 1
  const itemType = index % 5 === 0 ? 'assembly' : index % 7 === 0 ? 'material' : 'part'
  return {
    articleType: itemType === 'assembly' ? 'Gruppe' : itemType === 'material' ? 'Werkstoff' : 'Teil',
    calculatedCumulativeQuantity: index % 9 + 1,
    children: [],
    code: `PERF-${String(index % 401).padStart(4, '0')}`,
    description: `Performance item ${index} 10/${100 + index % 900}`,
    drawingNumber: `DRW-${index % 120}`,
    excelCumulativeQuantity: null,
    formattedRaw: { Stufe: level, Artikel: `PERF-${index}` },
    id: `performance-node-${index}`,
    isLeaf: itemType !== 'assembly',
    itemType,
    level,
    material: index % 3 === 0 ? 'S355' : 'DX51D',
    name: `Performance item ${index}`,
    name2: index % 2 ? 'Generated fixture' : '',
    parentCode: parent?.code ?? null,
    parentId: parent?.id ?? null,
    position: String(index),
    positionWeightKg: itemType === 'assembly' ? null : index % 20 + .5,
    quantityPerParent: index % 9 + 1,
    raw: { Stufe: level, Artikel: `PERF-${index}` },
    reuseCount: index % 11 === 0 ? 2 : 1,
    rolledWeightKg: itemType === 'assembly' ? 0 : index % 20 + .5,
    sourceRow: index + 2,
    sourceType: index % 2 ? 'Eigenfertigung' : 'Fremdbezug',
  }
}

/**
 * Deterministic, synthetic data. It contains no customer workbook content and
 * gives the tree the same deep/branching/reuse shapes used in production.
 */
export function createBomPerformanceDataset(rowCount: BomPerformanceDatasetSize): BomParseResult {
  const nodes: BomNode[] = []
  const roots: BomNode[] = []
  for (let index = 0; index < rowCount; index++) {
    const parent = index === 0 ? null : nodes[Math.floor((index - 1) / 4)] ?? null
    const node = nodeAt(index, parent)
    nodes.push(node)
    if (parent) {
      parent.children.push(node)
      parent.isLeaf = false
    } else roots.push(node)
  }
  const byCode = new Map<string, BomNode[]>()
  for (const node of nodes) byCode.set(node.code, [...(byCode.get(node.code) ?? []), node])
  return {
    byCode,
    headerRow: 1,
    leaves: nodes.filter((node) => node.isLeaf),
    nodes,
    rolledUpParts: [],
    root: roots[0] ?? null,
    roots,
    sheetName: `Synthetic ${rowCount.toLocaleString('en-US')} row BOM`,
    summary: {
      assemblies: nodes.filter((node) => node.itemType === 'assembly').length,
      leafItems: nodes.filter((node) => node.isLeaf).length,
      levels: Math.max(...nodes.map((node) => node.level)),
      materials: nodes.filter((node) => node.itemType === 'material').length,
      parts: nodes.filter((node) => node.itemType === 'part').length,
      rootCode: roots[0]?.code ?? '',
      rows: nodes.length,
      totalCalculatedLeafMassKg: 0,
      uniqueCodes: byCode.size,
    },
    warnings: [],
  }
}
