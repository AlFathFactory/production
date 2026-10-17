import { Button } from '../../../components/ui/Button'
import type { BomNode } from '../types'

interface BomFocusControlsProps {
  focusedNode: BomNode | null
  onFocus: (node: BomNode) => void
  onShowFullStructure: () => void
  selectedNode: BomNode | null
}

/** Compact contextual controls for narrowing the explorer to one occurrence. */
export function BomFocusControls({ focusedNode, onFocus, onShowFullStructure, selectedNode }: BomFocusControlsProps) {
  const canFocusSelectedNode = selectedNode && selectedNode.id !== focusedNode?.id

  if (!focusedNode && !canFocusSelectedNode) return null

  return (
    <div className="bom-focus-controls" aria-label="Structure focus controls">
      {focusedNode ? <p className="bom-focus-controls__status" role="status">Focused on: <strong>{focusedNode.code || 'Unnamed node'}</strong></p> : null}
      <div className="bom-focus-controls__actions">
        {canFocusSelectedNode ? <Button type="button" variant="secondary" onClick={() => onFocus(selectedNode)}>Show to Leaf</Button> : null}
        {focusedNode ? <Button type="button" variant="secondary" onClick={onShowFullStructure}>Back to Full Structure</Button> : null}
      </div>
    </div>
  )
}
