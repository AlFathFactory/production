import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import { BOM_PARSER_VERSION } from '../bomSourceFile'
import type { useBomImportPreparation } from '../hooks/useBomImportPreparation'
import type { BomParseResult } from '../types'

interface BomImportPreparationProps {
  file: File
  onAttached: (importId: string) => void
  preparation: ReturnType<typeof useBomImportPreparation>
  result: BomParseResult
}

const STAGES = [
  ['hashing', 'Checking workbook integrity'],
  ['creating', 'Creating import record'],
  ['uploading', 'Uploading original workbook'],
  ['attaching', 'Attaching source metadata'],
] as const

export function BomImportPreparation({ file, onAttached, preparation, result }: BomImportPreparationProps) {
  const projects = preparation.projectsQuery.data ?? []
  const projectNumbers = preparation.projectNumbersQuery.data ?? []
  const lots = preparation.lotsQuery.data ?? []
  const locked = preparation.isBusy || Boolean(preparation.attempt)
  const ready = Boolean(
    result.summary.rootCode
      && result.sheetName
      && result.headerRow > 0
      && preparation.projectId
      && preparation.projectNumberId
      && preparation.lotId
      && !preparation.projectsQuery.isPending
      && !preparation.projectNumbersQuery.isPending
      && !preparation.lotsQuery.isPending,
  )
  const currentStageIndex = STAGES.findIndex(([stage]) => stage === preparation.stage)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ready || preparation.isBusy || preparation.isComplete) return
    try {
      const prepared = await preparation.mutation.mutateAsync({
        file,
        parsed: result,
        projectId: preparation.projectId,
        projectNumberId: preparation.projectNumberId,
        lotId: preparation.lotId,
      })
      onAttached(prepared.importItem.id)
    } catch {
      // The mutation keeps its error and stage visible for a retry.
    }
  }

  return (
    <section className="bom-import-preparation" aria-labelledby="bom-import-preparation-title">
      <div className="bom-import-preparation__heading">
        <h2 id="bom-import-preparation-title">Prepare new BOM import</h2>
        <span>Source workbook</span>
      </div>
      <form onSubmit={(event) => void submit(event)}>
        <div className="bom-import-preparation__fields">
          <label>
            <span>Project *</span>
            <Select disabled={locked || preparation.projectsQuery.isPending} required value={preparation.projectId} onChange={(event) => preparation.selectProject(event.target.value)}>
              <option value="">Select project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.project_name}{project.is_active ? '' : ' (inactive)'}</option>)}
            </Select>
          </label>
          <label>
            <span>Project number *</span>
            <Select disabled={locked || !preparation.projectId || preparation.projectNumbersQuery.isPending} required value={preparation.projectNumberId} onChange={(event) => preparation.selectProjectNumber(event.target.value)}>
              <option value="">Select project number</option>
              {projectNumbers.map((number) => <option key={number.id} value={number.id}>{number.project_number} ({number.status})</option>)}
            </Select>
          </label>
          <label>
            <span>Lot *</span>
            <Select disabled={locked || !preparation.projectNumberId || preparation.lotsQuery.isPending} required value={preparation.lotId} onChange={(event) => preparation.setLotId(event.target.value)}>
              <option value="">Select lot</option>
              {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.lot_number} ({lot.status})</option>)}
            </Select>
          </label>
        </div>

        {preparation.projectsQuery.error || preparation.projectNumbersQuery.error || preparation.lotsQuery.error ? (
          <div className="bom-import-preparation__error" role="alert">
            Could not load the project hierarchy.
            <button type="button" onClick={() => {
              void preparation.projectsQuery.refetch()
              if (preparation.projectId) void preparation.projectNumbersQuery.refetch()
              if (preparation.projectNumberId) void preparation.lotsQuery.refetch()
            }}>Retry</button>
          </div>
        ) : null}

        <dl className="bom-import-preparation__facts">
          <div><dt>File *</dt><dd>{file.name}</dd></div>
          <div><dt>Sheet *</dt><dd>{result.sheetName}</dd></div>
          <div><dt>Header row *</dt><dd>{result.headerRow}</dd></div>
          <div><dt>Root code *</dt><dd>{result.summary.rootCode || 'Missing'}</dd></div>
          <div><dt>Parser version *</dt><dd>{BOM_PARSER_VERSION}</dd></div>
        </dl>

        {preparation.stage !== 'idle' ? (
          <ol className="bom-import-preparation__progress" aria-label="Source attachment progress">
            {STAGES.map(([stage, label], index) => (
              <li key={stage} aria-current={preparation.stage === stage ? 'step' : undefined}>
                <span>{preparation.isComplete || index < currentStageIndex ? 'Done' : index === currentStageIndex ? preparation.error ? 'Failed' : 'In progress' : 'Pending'}</span>
                {label}
              </li>
            ))}
          </ol>
        ) : null}

        {preparation.error ? (
          <p className="bom-import-preparation__error" role="alert">
            {preparation.stage === 'uploading' ? 'Storage upload failed. ' : preparation.stage === 'attaching' ? 'Source attachment failed. ' : ''}
            {preparation.error}
            {preparation.attempt ? ' Retry will use the same import record.' : ''}
          </p>
        ) : null}

        {preparation.isComplete && preparation.attempt ? (
          <p className="bom-import-preparation__success" role="status">
            Source workbook attached to import {preparation.attempt.importItem.id}. SHA-256: {preparation.attempt.sha256}. Structure save is still pending.
          </p>
        ) : null}

        {!preparation.isComplete ? (
          <Button disabled={!ready || preparation.isBusy} isLoading={preparation.isBusy} type="submit">
            {preparation.attempt ? 'Retry source attachment' : 'Create import and attach workbook'}
          </Button>
        ) : null}
      </form>
    </section>
  )
}
