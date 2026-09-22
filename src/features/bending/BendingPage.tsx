import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { PageHeader } from '../../components/shared/PageHeader'
import { ProjectLotSelector } from '../production/components/ProjectLotSelector'
import { BendingDispatchWorkflow } from './components/BendingDispatchWorkflow'
import { BendingReturnWorkflow } from './components/BendingReturnWorkflow'
import { BendingTabs, type BendingWorkflowTab } from './components/BendingTabs'

export function BendingPage() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectNumberId, setProjectNumberId] = useState<string | null>(null)
  const [lotId, setLotId] = useState<string | null>(null)
  const activeTab: BendingWorkflowTab = pathname === '/bending/receive' ? 'return' : 'dispatch'

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
      <PageHeader title="Packing" description="Create dispatch and return records for BEND materials." />
      <div className="bending-workspace">
        <ProjectLotSelector
          ariaLabel="Packing hierarchy selection"
          idPrefix="bending"
          lotId={lotId}
          projectId={projectId}
          projectNumberId={projectNumberId}
          onLotChange={selectLot}
          onProjectChange={selectProject}
          onProjectNumberChange={selectProjectNumber}
        />
        <BendingTabs activeTab={activeTab} onChange={(tab) => navigate(tab === 'dispatch' ? '/bending/issue' : '/bending/receive')} />
        {!lotId ? (
          <p className="bending-empty bending-empty--page">
            {activeTab === 'dispatch' ? 'Select a Lot to issue packing.' : 'Select a Lot to receive packing.'}
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
