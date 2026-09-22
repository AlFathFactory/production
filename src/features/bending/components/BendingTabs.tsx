import type { KeyboardEvent } from 'react'

export type BendingWorkflowTab = 'dispatch' | 'return'

interface BendingTabsProps {
  activeTab: BendingWorkflowTab
  onChange: (tab: BendingWorkflowTab) => void
}

export function BendingTabs({ activeTab, onChange }: BendingTabsProps) {
  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, tab: BendingWorkflowTab) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') {
      return
    }

    event.preventDefault()
    const nextTab = event.key === 'ArrowLeft' || event.key === 'Home'
      ? 'dispatch'
      : event.key === 'ArrowRight' || event.key === 'End'
        ? 'return'
        : tab
    onChange(nextTab)
    document.getElementById(`bending-${nextTab}-tab`)?.focus()
  }

  return (
    <div aria-label="Packing workflow" className="bending-tabs" role="tablist">
      <button
        aria-controls="bending-dispatch-panel"
        aria-selected={activeTab === 'dispatch'}
        className={activeTab === 'dispatch' ? 'bending-tabs__tab--active' : undefined}
        id="bending-dispatch-tab"
        role="tab"
        tabIndex={activeTab === 'dispatch' ? 0 : -1}
        type="button"
        onClick={() => onChange('dispatch')}
        onKeyDown={(event) => moveFocus(event, 'dispatch')}
      >
        Issue Packing
      </button>
      <button
        aria-controls="bending-return-panel"
        aria-selected={activeTab === 'return'}
        className={activeTab === 'return' ? 'bending-tabs__tab--active' : undefined}
        id="bending-return-tab"
        role="tab"
        tabIndex={activeTab === 'return' ? 0 : -1}
        type="button"
        onClick={() => onChange('return')}
        onKeyDown={(event) => moveFocus(event, 'return')}
      >
        Receive Packing
      </button>
    </div>
  )
}
