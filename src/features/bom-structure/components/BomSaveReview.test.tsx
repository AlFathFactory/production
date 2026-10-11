import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SetStateAction } from 'react'
import { describe, expect, test, vi } from 'vitest'

import { BomSaveReview } from './BomSaveReview'
import type { useBomNodeSave } from '../hooks/useBomNodeSave'
import type { BomValidationResult } from '../mappers/bomValidation'
import type { BomParseResult } from '../types'

type Saving = ReturnType<typeof useBomNodeSave>

function mutationStub(overrides: Record<string, unknown> = {}) {
  return {
    error: null,
    isPending: false,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  }
}

function savingStub(overrides: Partial<Saving> = {}): Saving {
  return {
    acknowledgedWarnings: false,
    isBusy: false,
    replaceMutation: mutationStub() as unknown as Saving['replaceMutation'],
    reset: vi.fn(),
    saveMutation: mutationStub() as unknown as Saving['saveMutation'],
    setAcknowledgedWarnings: vi.fn(),
    validateMutation: mutationStub() as unknown as Saving['validateMutation'],
    validatedImportId: null,
    validation: null,
    ...overrides,
  } as unknown as Saving
}

function validationStub(overrides: Partial<BomValidationResult> = {}): BomValidationResult {
  return {
    errorCount: 0,
    errors: [],
    isValid: true,
    nodeCount: 12,
    rootCount: 1,
    warningCount: 0,
    warnings: [],
    ...overrides,
  }
}

function parsedStub(): BomParseResult {
  return { nodes: new Array(12).fill({}) } as unknown as BomParseResult
}

describe('BomSaveReview', () => {
  test('save is unavailable before backend validation runs', () => {
    render(<BomSaveReview importId="import-1" onSaved={vi.fn()} result={parsedStub()} saving={savingStub()} />)
    expect(screen.getByRole('button', { name: /validate nodes/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save bom structure/i })).toBeNull()
  })

  test('validation errors block save and list the cause', () => {
    const saving = savingStub({
      validatedImportId: 'import-1',
      validation: validationStub({
        errorCount: 1,
        errors: [{ kind: 'invalid-quantity', message: 'Quantity must be positive.', sourceRow: 7 }],
        isValid: false,
      }),
    })
    render(<BomSaveReview importId="import-1" onSaved={vi.fn()} result={parsedStub()} saving={saving} />)
    expect(screen.getByText(/backend validation failed/i)).toBeInTheDocument()
    expect(screen.getByText(/quantity must be positive/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save bom structure/i })).toBeDisabled()
  })

  test('warnings require acknowledgement before save is enabled', async () => {
    const user = userEvent.setup()
    const setAcknowledgedWarnings = vi.fn()
    let acknowledged = false
    const { rerender } = render(
      <BomSaveReview
        importId="import-1"
        onSaved={vi.fn()}
        result={parsedStub()}
        saving={savingStub({
          setAcknowledgedWarnings: (value: SetStateAction<boolean>) => {
            acknowledged = value === true
            setAcknowledgedWarnings(value)
          },
          validatedImportId: 'import-1',
          validation: validationStub({
            warningCount: 1,
            warnings: [{ kind: 'cumulative-mismatch', message: 'Excel cumulative differs.', sourceRow: 9 }],
          }),
        })}
      />,
    )
    const save = screen.getByRole('button', { name: /save bom structure/i })
    expect(save).toBeDisabled()
    await user.click(screen.getByLabelText(/i reviewed the backend warnings/i))
    expect(setAcknowledgedWarnings).toHaveBeenCalledWith(true)
    rerender(
      <BomSaveReview
        importId="import-1"
        onSaved={vi.fn()}
        result={parsedStub()}
        saving={savingStub({
          acknowledgedWarnings: acknowledged,
          setAcknowledgedWarnings,
          validatedImportId: 'import-1',
          validation: validationStub({
            warningCount: 1,
            warnings: [{ kind: 'cumulative-mismatch', message: 'Excel cumulative differs.', sourceRow: 9 }],
          }),
        })}
      />,
    )
    expect(screen.getByRole('button', { name: /save bom structure/i })).toBeEnabled()
  })

  test('replace mode requires the typed REPLACE confirmation', async () => {
    const user = userEvent.setup()
    render(
      <BomSaveReview
        importId="import-1"
        mode="replace"
        onSaved={vi.fn()}
        result={parsedStub()}
        saving={savingStub({ validatedImportId: 'import-1', validation: validationStub() })}
      />,
    )
    const replace = screen.getByRole('button', { name: /^replace current import$/i })
    expect(replace).toBeDisabled()
    await user.type(screen.getByLabelText(/confirm replacement/i), 'REPLAC')
    expect(replace).toBeDisabled()
    await user.type(screen.getByLabelText(/confirm replacement/i), 'E')
    expect(replace).toBeEnabled()
  })

  test('save failure shows the error with reopen-before-retry guidance', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    const saveMutation = mutationStub({ error: new Error('The save response needs review.') })
    render(
      <BomSaveReview
        importId="import-1"
        onSaved={onSaved}
        result={parsedStub()}
        saving={savingStub({
          saveMutation: saveMutation as unknown as Saving['saveMutation'],
          validatedImportId: 'import-1',
          validation: validationStub(),
        })}
      />,
    )
    expect(screen.getByText(/the save response needs review/i)).toBeInTheDocument()
    expect(screen.getByText(/reopen this import before retrying/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /save bom structure/i }))
    expect(saveMutation.mutateAsync).toHaveBeenCalledWith({ importId: 'import-1' })
    expect(onSaved).not.toHaveBeenCalled()
  })
})
