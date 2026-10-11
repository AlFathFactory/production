import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'

import { BomToolbar, type BomToolbarFilters } from './BomToolbar'
import type { BomItemType } from '../types'

function defaultFilters(): BomToolbarFilters {
  return {
    itemTypes: new Set<BomItemType>(['assembly', 'part', 'material']),
    leafOnly: false,
    level: null,
    reusedOnly: false,
    sourceTypes: new Set(['Eigenfertigung', 'Fremdbezug']),
    unmappedDimensionsOnly: false,
    warningsOnly: false,
  }
}

function Harness({ onFiltersChange = vi.fn(), onQueryChange = vi.fn() }: {
  onFiltersChange?: (filters: BomToolbarFilters) => void
  onQueryChange?: (query: string) => void
}) {
  const [filters, setFilters] = useState(defaultFilters())
  const [query, setQuery] = useState('')
  return (
    <BomToolbar
      filters={filters}
      maxLevel={6}
      onClearFilters={() => {
        setFilters(defaultFilters())
        setQuery('')
      }}
      onCollapseAll={vi.fn()}
      onExpandAll={vi.fn()}
      onFiltersChange={(next) => {
        setFilters(next)
        onFiltersChange(next)
      }}
      onQueryChange={(next) => {
        setQuery(next)
        onQueryChange(next)
      }}
      query={query}
      unmappedDimensionsAvailable
    />
  )
}

describe('BomToolbar', () => {
  test('search input reports the typed query', async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn()
    render(<Harness onQueryChange={onQueryChange} />)
    await user.type(screen.getByPlaceholderText(/code, description, material/i), 'AKT-10')
    expect(onQueryChange).toHaveBeenLastCalledWith('AKT-10')
  })

  test('level filter selects a single level', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<Harness onFiltersChange={onFiltersChange} />)
    await user.selectOptions(screen.getByLabelText(/filter by level/i), '3')
    expect(onFiltersChange).toHaveBeenLastCalledWith(expect.objectContaining({ level: 3 }))
  })

  test('does not render item type, source type, or expand-to-level controls', () => {
    render(<Harness />)
    expect(screen.queryByText('Item type')).toBeNull()
    expect(screen.queryByText('Source type')).toBeNull()
    expect(screen.queryByText('Expand to level')).toBeNull()
  })

  test('leaves, reused, warnings, and unmapped toggles report checked state', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(<Harness onFiltersChange={onFiltersChange} />)
    await user.click(screen.getByLabelText('Leaves only'))
    await user.click(screen.getByLabelText('Reused only'))
    await user.click(screen.getByLabelText('Warnings only'))
    await user.click(screen.getByLabelText('Unmapped dimensions'))
    const next = onFiltersChange.mock.calls.at(-1)?.[0] as BomToolbarFilters
    expect(next).toMatchObject({ leafOnly: true, reusedOnly: true, warningsOnly: true, unmappedDimensionsOnly: true })
  })

  test('clear filters restores defaults once a filter is active', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.queryByRole('button', { name: /clear filters/i })).toBeNull()
    await user.click(screen.getByLabelText('Leaves only'))
    await user.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(screen.queryByRole('button', { name: /clear filters/i })).toBeNull()
    expect(screen.getByLabelText('Leaves only')).not.toBeChecked()
  })
})
