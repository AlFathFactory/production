import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import { SettingsPage } from './SettingsPage'

const state = vi.hoisted(() => ({
  create: vi.fn(),
  delete: vi.fn(),
  options: [{ id: 'bend', route: 'BEND' as const, label: 'Bending', isActive: true, sortOrder: 10, createdAt: new Date(), updatedAt: new Date() }],
  update: vi.fn(),
}))

vi.mock('./queries/routeAssignmentOptionsQueries', () => ({
  useRouteAssignmentOptions: () => ({ data: state.options, error: null, isPending: false, refetch: vi.fn() }),
  useCreateRouteAssignmentOption: () => ({ error: null, isPending: false, mutateAsync: state.create, reset: vi.fn() }),
  useUpdateRouteAssignmentOption: () => ({ error: null, isPending: false, mutateAsync: state.update, reset: vi.fn() }),
  useDeleteRouteAssignmentOption: () => ({ error: null, isPending: false, mutate: state.delete }),
}))

describe('SettingsPage', () => {
  test('shows the administration settings cards and route management screen', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)
    expect(screen.getByRole('heading', { name: 'Route Assignment' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Coming Later' })).toBeDisabled()
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
})
