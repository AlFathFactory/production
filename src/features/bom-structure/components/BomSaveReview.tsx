import { Button } from '../../../components/ui/Button'
import type { useBomNodeSave } from '../hooks/useBomNodeSave'
import type { BomParseResult } from '../types'

interface Props {
  importId: string
  onSaved: (importId: string) => void
  result: BomParseResult
  saving: ReturnType<typeof useBomNodeSave>
}

export function BomSaveReview({ importId, onSaved, result, saving }: Props) {
  const validation = saving.validatedImportId === importId ? saving.validation : null
  const canSave = Boolean(validation?.isValid && validation.errorCount === 0
    && (!validation.warningCount || saving.acknowledgedWarnings))

  const save = async () => {
    try {
      const saved = await saving.saveMutation.mutateAsync({ importId, parsed: result })
      onSaved(saved.importId)
    } catch {
      // Keep the mutation error visible, including ambiguous network outcomes.
    }
  }

  return (
    <section className="bom-save-review" aria-labelledby="bom-save-review-title">
      <h2 id="bom-save-review-title">Validate and save structure</h2>
      <p>{result.nodes.length.toLocaleString('en-US')} workbook occurrences will be validated by the backend and saved to this attached import.</p>
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
        <Button disabled={!canSave || saving.isBusy} isLoading={saving.saveMutation.isPending} type="button" onClick={() => void save()}>
          Save BOM structure
        </Button>
      ) : null}
      {saving.saveMutation.error ? <p className="bom-save-review__error" role="alert">{saving.saveMutation.error.message} If the request may have completed, reopen this import before retrying.</p> : null}
    </section>
  )
}
