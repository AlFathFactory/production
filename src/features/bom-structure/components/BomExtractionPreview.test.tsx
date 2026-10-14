import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import { BomExtractionPreview } from './BomExtractionPreview'
import type { BomExtractionCandidate, BomProductionExtractionResult } from '../types/bomDomain.types'

const { statusState, executeState, routeOptionsState } = vi.hoisted(() => ({
  statusState: { data: null as BomProductionExtractionResult | null, error: null as Error | null, isPending: false },
  executeState: {
    data: null as BomProductionExtractionResult | null,
    error: null as Error | null,
    isPending: false,
    mutate: vi.fn(),
    requestId: 'request-execute-1',
  },
  routeOptionsState: {
    data: [
      { id: 'route-bend', route: 'BEND', label: 'Bending', isActive: true, sortOrder: 10, createdAt: new Date(), updatedAt: new Date() },
      { id: 'route-rod', route: 'ROD', label: 'Rod line', isActive: true, sortOrder: 20, createdAt: new Date(), updatedAt: new Date() },
    ],
    error: null as Error | null,
    isPending: false,
  },
}))

vi.mock('../queries/usePersistedBom', () => ({
  useBomExtractionStatus: () => ({
    data: statusState.data,
    error: statusState.error,
    isPending: statusState.isPending,
    refetch: vi.fn(),
  }),
}))

vi.mock('../hooks/useBomExtraction', () => ({
  useBomExtraction: () => ({ executeMutation: executeState, requestId: executeState.requestId, rotateRequestId: vi.fn() }),
}))

vi.mock('../../settings/queries/routeAssignmentOptionsQueries', () => ({
  useRouteAssignmentOptions: () => ({ ...routeOptionsState, isSuccess: !routeOptionsState.isPending && !routeOptionsState.error, refetch: vi.fn() }),
}))

function candidate(article: string, blockers: BomExtractionCandidate['blockers'] = ['routing-assignment-required']): BomExtractionCandidate {
  return {
    article,
    blockers,
    designation: `Designation ${article}`,
    drawingNumber: null,
    heightValue: null,
    importId: 'import-1',
    isReadyForProduction: true,
    lengthValue: null,
    lotId: 'lot-1',
    material: 'S235',
    name: `Name ${article}`,
    name2: null,
    occurrenceCount: 1,
    profile: null,
    representativeNodeId: `node-${article}`,
    requiresRoutingAssignment: true,
    sourceType: 'Eigenfertigung',
    totalQuantity: 4,
    totalWeightKg: 12,
    unitWeightKg: 3,
    versionGroupId: 'group-1',
    versionNumber: 1,
    widthValue: null,
  }
}

function extractedStatus(): BomProductionExtractionResult {
  return {
    alreadyExtracted: true,
    candidateCount: 2,
    createdAt: new Date('2026-10-10T10:00:00Z'),
    createdCount: 2,
    extractionId: 'extraction-1',
    importId: 'import-1',
    lotId: 'lot-1',
    requestId: 'request-ledger-1',
    skippedCount: 0,
    versionNumber: 1,
  }
}

function resetMocks() {
  vi.clearAllMocks()
  statusState.data = null
  statusState.error = null
  statusState.isPending = false
  executeState.data = null
  executeState.error = null
  executeState.isPending = false
  routeOptionsState.data = [
    { id: 'route-bend', route: 'BEND', label: 'Bending', isActive: true, sortOrder: 10, createdAt: new Date(), updatedAt: new Date() },
    { id: 'route-rod', route: 'ROD', label: 'Rod line', isActive: true, sortOrder: 20, createdAt: new Date(), updatedAt: new Date() },
  ]
  routeOptionsState.error = null
  routeOptionsState.isPending = false
}

describe('BomExtractionPreview', () => {
  test('operator sees a read-only preview with disabled route selects', () => {
    resetMocks()
    render(<BomExtractionPreview candidates={[candidate('A-1'), candidate('A-2')]} canExecute={false} importId="import-1" lotId="lot-1" versionNumber={1} />)
    expect(screen.getByText(/requires an active supervisor or admin/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /extract to production/i })).toBeNull()
    expect(screen.getByLabelText('Route for A-1')).toBeDisabled()
  })

  test('supervisor assigns every route, confirms, and executes', async () => {
    resetMocks()
    const user = userEvent.setup()
    render(<BomExtractionPreview candidates={[candidate('A-1'), candidate('A-2')]} canExecute importId="import-1" lotId="lot-1" versionNumber={1} />)
    const execute = screen.getByRole('button', { name: /extract to production/i })
    expect(execute).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Route for A-1'), 'BEND')
    await user.selectOptions(screen.getByLabelText('Route for A-2'), 'ROD')
    expect(screen.getByText(/2 of 2 routes assigned/i)).toBeInTheDocument()
    expect(execute).toBeDisabled()
    await user.click(screen.getByLabelText(/i confirm extraction of v1/i))
    expect(execute).toBeEnabled()
    await user.click(execute)
    expect(executeState.mutate).toHaveBeenCalledWith({ 'A-1': 'BEND', 'A-2': 'ROD' })
  })

  test('displays configured labels while submitting their fixed system-route values', async () => {
    resetMocks()
    const user = userEvent.setup()
    render(<BomExtractionPreview candidates={[candidate('A-1')]} canExecute importId="import-1" lotId="lot-1" versionNumber={1} />)
    expect(screen.getByRole('option', { name: 'Bending' })).toHaveValue('BEND')
    await user.selectOptions(screen.getByLabelText('Route for A-1'), 'BEND')
    await user.click(screen.getByLabelText(/i confirm extraction of v1/i))
    await user.click(screen.getByRole('button', { name: /extract to production/i }))
    expect(executeState.mutate).toHaveBeenCalledWith({ 'A-1': 'BEND' })
  })

  test('fails closed when no active route options are configured', () => {
    resetMocks()
    routeOptionsState.data = []
    render(<BomExtractionPreview candidates={[candidate('A-1')]} canExecute importId="import-1" lotId="lot-1" versionNumber={1} />)
    expect(screen.getByText(/no active route assignment options/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Route for A-1')).toBeDisabled()
    expect(screen.getByRole('button', { name: /extract to production/i })).toBeDisabled()
  })

  test('does not fall back to hardcoded routes when the settings query fails', () => {
    resetMocks()
    routeOptionsState.error = new Error('Unavailable')
    render(<BomExtractionPreview candidates={[candidate('A-1')]} canExecute importId="import-1" lotId="lot-1" versionNumber={1} />)
    expect(screen.getByText(/could not load route assignment options/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Route for A-1')).toBeDisabled()
    expect(screen.queryByRole('option', { name: 'NO BEND' })).toBeNull()
  })

  test('searches candidates and keeps route assignments across pages', async () => {
    resetMocks()
    const user = userEvent.setup()
    const candidates = Array.from({ length: 26 }, (_, index) => candidate(`A-${index + 1}`))
    render(<BomExtractionPreview candidates={candidates} canExecute importId="import-1" lotId="lot-1" versionNumber={1} />)

    expect(screen.getByText('Showing 1–25 of 26 candidates')).toBeInTheDocument()
    expect(screen.queryByLabelText('Route for A-26')).toBeNull()
    await user.selectOptions(screen.getByLabelText('Route for A-1'), 'BEND')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByLabelText('Route for A-26')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Route for A-26'), 'ROD')

    await user.type(screen.getByRole('searchbox', { name: 'Search candidates' }), 'Designation A-1')
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Route for A-1')).toHaveValue('BEND')
    expect(screen.queryByLabelText('Route for A-26')).toBeNull()
    expect(screen.getByText('2 of 26 routes assigned for import import-1.')).toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'Search candidates' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByLabelText('Route for A-26')).toHaveValue('ROD')
  })

  test('non-routing blockers prevent extraction and explain the cause', () => {
    resetMocks()
    render(<BomExtractionPreview candidates={[candidate('A-1', ['missing-material']), candidate('A-2')]} canExecute importId="import-1" lotId="lot-1" versionNumber={1} />)
    expect(screen.getByText(/1 candidate\(s\) have unresolved non-routing blockers/i)).toBeInTheDocument()
    expect(screen.getByText('Not assignable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /extract to production/i })).toBeDisabled()
  })

  test('already-extracted versions show the ledger state without an execute action', () => {
    resetMocks()
    statusState.data = extractedStatus()
    render(<BomExtractionPreview candidates={[candidate('A-1'), candidate('A-2')]} canExecute importId="import-1" lotId="lot-1" versionNumber={1} />)
    expect(screen.getByText(/already extracted/i)).toBeInTheDocument()
    expect(screen.getByText(/re-extraction of this version is not allowed/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /extract to production/i })).toBeNull()
    expect(screen.getByLabelText('Route for A-1')).toBeDisabled()
  })

  test('execute failure keeps the request id visible for ledger-first recovery', () => {
    resetMocks()
    executeState.error = new Error('An article already exists in this Production lot; extraction was not started')
    render(<BomExtractionPreview candidates={[candidate('A-1')]} canExecute importId="import-1" lotId="lot-1" versionNumber={1} />)
    expect(screen.getByText(/already exists in this production lot/i)).toBeInTheDocument()
    expect(screen.getByText(/request-execute-1/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload extraction status/i })).toBeInTheDocument()
  })
})
