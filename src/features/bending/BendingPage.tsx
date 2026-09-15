import { useState } from 'react'

import { PageHeader } from '../../components/shared/PageHeader'
import { ProjectLotSelector } from '../production/components/ProjectLotSelector'
import { BendingDispatchWorkflow } from './components/BendingDispatchWorkflow'
import { BendingReturnWorkflow } from './components/BendingReturnWorkflow'
import { BendingTabs, type BendingWorkflowTab } from './components/BendingTabs'

export function BendingPage() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectNumberId, setProjectNumberId] = useState<string | null>(null)
  const [lotId, setLotId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<BendingWorkflowTab>('dispatch')

  const selectProject = (nextProjectId: string | null) => {
    setProjectId(nextProjectId)
    setProjectNumberId(null)
    setLotId(null)
  }

  const selectProjectNumber = (nextProjectNumberId: string | null) => {
    setProjectNumberId(nextProjectNumberId)
    setLotId(null)
  }

  const selectLot = (nextLotId: string | null) => {
    setLotId(nextLotId)
  }

  return (
    <>
      <PageHeader title="Bending" description="Create document-driven dispatch and return records for BEND materials." />
      <div className="bending-workspace">
        <ProjectLotSelector
          ariaLabel="Bending hierarchy selection"
          idPrefix="bending"
          lotId={lotId}
          projectId={projectId}
          projectNumberId={projectNumberId}
          onLotChange={selectLot}
          onProjectChange={selectProject}
          onProjectNumberChange={selectProjectNumber}
        />
        <BendingTabs activeTab={activeTab} onChange={setActiveTab} />
        {!lotId ? (
          <p className="bending-empty bending-empty--page">
            {activeTab === 'dispatch' ? 'Select a Lot to create a Bending Dispatch.' : 'Select a Lot to view Bending Dispatches.'}
          </p>
        ) : null}
        {lotId && activeTab === 'dispatch' ? (
          <BendingDispatchWorkflow key={lotId} lotId={lotId} projectId={projectId} projectNumberId={projectNumberId} />
        ) : null}
        {lotId && activeTab === 'return' ? <BendingReturnWorkflow key={lotId} lotId={lotId} /> : null}
      </div>
    </>
  )
}
