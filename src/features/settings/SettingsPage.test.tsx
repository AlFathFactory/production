import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import { SettingsPage } from './SettingsPage'

const state = vi.hoisted(() => ({
  create: vi.fn(),
  delete: vi.fn(),
  options: [{ id: 'bend', route: 'BEND' as const, label: 'Bending', isActive: true, sortOrder: 10, createdAt: new Date(), updatedAt: new Date() }],
  update: vi.fn(),
  designation: {
    createMapping: vi.fn(),
    createType: vi.fn(),
    deleteMapping: vi.fn(),
    deleteType: vi.fn(),
    deleteTypeError: null as Error | null,
    mappings: [{ id: 'mapping-akt', code: 'AKT', typeId: 'type-plate', isActive: true, sortOrder: 10 }],
    types: [
      { id: 'type-plate', name: 'PLATE', isActive: true, sortOrder: 10 },
      { id: 'type-pipe', name: 'PIPE', isActive: false, sortOrder: 20 },
    ],
    updateMapping: vi.fn(),
    updateType: vi.fn(),
  },
}))

vi.mock('./queries/routeAssignmentOptionsQueries', () => ({
  useRouteAssignmentOptions: () => ({ data: state.options, error: null, isPending: false, refetch: vi.fn() }),
  useCreateRouteAssignmentOption: () => ({ error: null, isPending: false, mutateAsync: state.create, reset: vi.fn() }),
  useUpdateRouteAssignmentOption: () => ({ error: null, isPending: false, mutateAsync: state.update, reset: vi.fn() }),
  useDeleteRouteAssignmentOption: () => ({ error: null, isPending: false, mutate: state.delete }),
}))

vi.mock('./queries/designationMappingSettingsQueries', () => ({
  useDesignationTypeSettings: () => ({ data: state.designation.types, error: null, isPending: false, refetch: vi.fn() }),
  useDesignationMappingSettings: () => ({ data: state.designation.mappings, error: null, isPending: false, refetch: vi.fn() }),
  useCreateDesignationType: () => ({ error: null, isPending: false, mutateAsync: state.designation.createType, reset: vi.fn() }),
  useUpdateDesignationType: () => ({ error: null, isPending: false, mutate: state.designation.updateType, mutateAsync: state.designation.updateType, reset: vi.fn() }),
  useDeleteDesignationType: () => ({ error: state.designation.deleteTypeError, isPending: false, mutate: state.designation.deleteType }),
  useCreateDesignationMapping: () => ({ error: null, isPending: false, mutateAsync: state.designation.createMapping, reset: vi.fn() }),
  useUpdateDesignationMapping: () => ({ error: null, isPending: false, mutate: state.designation.updateMapping, mutateAsync: state.designation.updateMapping, reset: vi.fn() }),
  useDeleteDesignationMapping: () => ({ error: null, isPending: false, mutate: state.designation.deleteMapping }),
}))

describe('SettingsPage', () => {
  test('shows the administration settings cards and route management screen', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)
    expect(screen.getByRole('heading', { name: 'Route Assignment' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Coming Later' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Manage Excel Mapping' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Manage Routes' }))
    expect(screen.getByRole('columnheader', { name: 'System Route' })).toBeInTheDocument()
    expect(screen.getByText('Bending')).toBeInTheDocument()
  })

  test('only offers missing fixed system routes when adding an option', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)
    await user.click(screen.getByRole('button', { name: 'Manage Routes' }))
    await user.click(screen.getByRole('button', { name: 'Add Route' }))
    const systemRoute = screen.getByLabelText('System Route')
    expect(within(systemRoute).queryByRole('option', { name: 'BEND' })).toBeNull()
    expect(within(systemRoute).getByRole('option', { name: 'NO BEND' })).toBeInTheDocument()
  })

  test('keeps the system route immutable while editing', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)
    await user.click(screen.getByRole('button', { name: 'Manage Routes' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText('System Route')).toBeDisabled()
    expect(screen.getByLabelText('System Route')).toHaveValue('BEND')
  })

  test('requires confirmation before deleting a route option', async () => {
    const user = userEvent.setup()
    state.delete.mockClear()
    render(<SettingsPage />)
    await user.click(screen.getByRole('button', { name: 'Manage Routes' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete Route Option' })
    expect(dialog).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))
    expect(state.delete).toHaveBeenCalledWith('bend', expect.objectContaining({ onSuccess: expect.any(Function) }))
  })

  test('opens Excel Mapping management with designation type and code-mapping tables', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)
    await user.click(screen.getByRole('button', { name: 'Manage Excel Mapping' }))
    expect(screen.getByRole('heading', { name: 'Designation Types' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Designation Code Mappings' })).toBeInTheDocument()
    expect(screen.getAllByText('PLATE')).toHaveLength(2)
    expect(screen.getByText('AKT')).toBeInTheDocument()
  })

  test('adds a type and offers active types only when adding a mapping', async () => {
    const user = userEvent.setup()
    state.designation.createType.mockResolvedValueOnce(undefined)
    render(<SettingsPage />)
    await user.click(screen.getByRole('button', { name: 'Manage Excel Mapping' }))
    await user.click(screen.getByRole('button', { name: 'Add Type' }))
    await user.type(screen.getByLabelText('Type Name'), '  RHS  ')
    await user.click(within(screen.getByRole('dialog', { name: 'Add Designation Type' })).getByRole('button', { name: 'Add Type' }))
    expect(state.designation.createType).toHaveBeenCalledWith({ name: 'RHS', isActive: true, sortOrder: 10 })

    await user.click(screen.getByRole('button', { name: 'Add Mapping' }))
    const mapsTo = screen.getByLabelText('Maps To')
    expect(within(mapsTo).getByRole('option', { name: 'PLATE' })).toBeInTheDocument()
    expect(within(mapsTo).queryByRole('option', { name: 'PIPE' })).toBeNull()
  })

  test('shows the friendly in-use error when deleting a designation type', async () => {
    const user = userEvent.setup()
    state.designation.deleteTypeError = null
    const view = render(<SettingsPage />)
    await user.click(screen.getByRole('button', { name: 'Manage Excel Mapping' }))
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!)
    state.designation.deleteTypeError = new Error('This type is currently used by one or more designation mappings. Remove or change those mappings first.')
    view.rerender(<SettingsPage />)
    expect(screen.getByText(/this type is currently used by one or more designation mappings/i)).toBeInTheDocument()
    state.designation.deleteTypeError = null
  })
})
