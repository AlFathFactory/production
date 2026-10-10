import { Button } from '../../../components/ui/Button'
import type { useBomNodeSave } from '../hooks/useBomNodeSave'
import type { BomParseResult } from '../types'

interface Props {
  importId: string
  mode?: 'save' | 'replace'
  onSaved: (importId: string) => void
  result: BomParseResult
  saving: ReturnType<typeof useBomNodeSave>
}

export function BomSaveReview({ importId, mode = 'save', onSaved, result, saving }: Props) {
  const [confirmation, setConfirmation] = useState('')
  const validation = saving.validatedImportId === importId ? saving.validation : null
  const canSave = Boolean(validation?.isValid && validation.errorCount === 0
    && (!validation.warningCount || saving.acknowledgedWarnings)
    && (mode !== 'replace' || confirmation === 'REPLACE'))

  const save = async () => {
    try {
      const saved = await (mode === 'replace' ? saving.replaceMutation : saving.saveMutation).mutateAsync({ importId })
      onSaved(saved.importId)
    } catch {
      // Keep the mutation error visible, including ambiguous network outcomes.
    }
  }

  return (
    <section className="bom-save-review" aria-labelledby="bom-save-review-title">
      <h2 id="bom-save-review-title">{mode === 'replace' ? 'Replace Current Import' : 'Validate and save structure'}</h2>
      <p>{result.nodes.length.toLocaleString('en-US')} workbook occurrences will be validated by the backend {mode === 'replace' ? 'before replacing the current saved nodes. This is an atomic, destructive replacement.' : 'and saved to this attached import.'}</p>
      <Button disabled={saving.isBusy} isLoading={saving.validateMutation.isPending} type="button" onClick={() => void saving.validateMutation.mutateAsync({ importId, parsed: result }).catch(() => undefined)}>
        {validation ? 'Validate again' : 'Validate nodes'}
      </Button>
      {saving.validateMutation.error ? <p className="bom-save-review__error" role="alert">{saving.validateMutation.error.message}</p> : null}
      {validation ? (
        <div className="bom-save-review__result" role="status">
          <strong>{validation.isValid ? 'Backend validation passed' : 'Backend validation failed'}</strong>
          <span>{validation.nodeCount} nodes · {validation.rootCount} roots · {validation.errorCount} errors · {validation.warningCount} warnings</span>
          {validation.errors.length ? (
            <div className="bom-save-review__issues" role="alert">
              {validation.errors.map((issue, index) => <p key={`error-${index}`}><strong>Error{issue.sourceRow ? ` at Excel row ${issue.sourceRow}` : ''}:</strong> {issue.message}</p>)}
            </div>
          ) : null}
          {validation.warnings.length ? (
            <div className="bom-save-review__issues">
              {validation.warnings.map((issue, index) => <p key={`warning-${index}`}><strong>Warning{issue.sourceRow ? ` at Excel row ${issue.sourceRow}` : ''}:</strong> {issue.message}</p>)}
            </div>
          ) : null}
          {validation.isValid && validation.warningCount > 0 ? (
            <label className="bom-save-review__acknowledge">
              <input checked={saving.acknowledgedWarnings} type="checkbox" onChange={(event) => saving.setAcknowledgedWarnings(event.target.checked)} />
              I reviewed the backend warnings and want to save this BOM.
            </label>
          ) : null}
        </div>
      ) : null}
      {validation ? (
        <div>
          {mode === 'replace' ? <label>Type REPLACE to confirm <input aria-label="Confirm replacement" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label> : null}
          <Button disabled={!canSave || saving.isBusy} isLoading={mode === 'replace' ? saving.replaceMutation.isPending : saving.saveMutation.isPending} type="button" onClick={() => void save()}>
            {mode === 'replace' ? 'Replace Current Import' : 'Save BOM structure'}
          </Button>
        </div>
      ) : null}
      {saving.saveMutation.error ? <p className="bom-save-review__error" role="alert">{saving.saveMutation.error.message} If the request may have completed, reopen this import before retrying.</p> : null}
      {saving.replaceMutation.error ? <p className="bom-save-review__error" role="alert">{saving.replaceMutation.error.message} If the request may have completed, reopen this import before retrying.</p> : null}
    </section>
  )
}
import { useState } from 'react'
