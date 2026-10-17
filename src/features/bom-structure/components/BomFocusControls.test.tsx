import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMemo, useState } from 'react'
import { describe, expect, test } from 'vitest'

import { getExpandableNodeIds, getSubtreeByNodeId, getVisibleBomNodes } from '../bomTree'
import type { BomNode } from '../types'
import { BomFocusControls } from './BomFocusControls'
import { BomTree } from './BomTree'

function node(id: string, code: string, children: BomNode[] = []): BomNode {
  return {
    articleType: '', calculatedCumulativeQuantity: 1, children, code, drawingNumber: '', excelCumulativeQuantity: null,
    formattedRaw: {}, id, isLeaf: children.length === 0, itemType: children.length ? 'assembly' : 'part', level: 1,
    material: '', name: code, name2: '', parentCode: null, parentId: null, position: '', positionWeightKg: null,
    quantityPerParent: 1, raw: {}, reuseCount: 1, rolledWeightKg: 0, sourceRow: 1, sourceType: 'Eigenfertigung',
  }
}

const filters = {
  itemTypes: new Set<BomNode['itemType']>(['assembly', 'part', 'material']), level: null, leafOnly: false,
  query: '', reusedOnly: false, sourceRowsWithWarnings: new Set<number>(), sourceTypes: new Set(['Eigenfertigung', 'Fremdbezug']),
  unmappedDimensionCodes: new Set<string>(), unmappedDimensionsOnly: false, warningsOnly: false,
}

function FocusHarness() {
  const root = useMemo(() => node('a', 'A', [node('b', 'B', [node('c', 'C')]), node('f', 'F')]), [])
  const [selected, setSelected] = useState<BomNode | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const roots = focusedId ? getSubtreeByNodeId([root], focusedId) : [root]
  const focused = roots[0] ?? null
  const visible = getVisibleBomNodes(roots, getExpandableNodeIds(roots), filters)

  return <>
    <BomFocusControls
      focusedNode={focusedId ? focused : null}
      selectedNode={selected}
      onFocus={(selectedNode) => setFocusedId(selectedNode.id)}
      onShowFullStructure={() => setFocusedId(null)}
    />
    <BomTree expandedIds={getExpandableNodeIds(roots)} onSelect={setSelected} onToggle={() => undefined} query="" revealId={null} selectedId={selected?.id ?? null} visibleNodes={visible} />
  </>
}

describe('BomFocusControls integration', () => {
  test('selects an occurrence, focuses it to its leaf, then restores the full structure', async () => {
    const user = userEvent.setup()
    render(<FocusHarness />)

    expect(screen.getByRole('treeitem', { name: /^A:/ })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: /^F:/ })).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'B' })[0])
    await user.click(screen.getByRole('button', { name: /show to leaf/i }))

    expect(screen.getByText(/focused on:/i)).toHaveTextContent('B')
    expect(screen.queryByRole('treeitem', { name: /^A:/ })).toBeNull()
    expect(screen.queryByRole('treeitem', { name: /^F:/ })).toBeNull()
    expect(screen.getByRole('treeitem', { name: /^C:/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /back to full structure/i }))
    expect(screen.getByRole('treeitem', { name: /^A:/ })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: /^F:/ })).toBeInTheDocument()
  })
})
