import type { BomPipelineStage } from '../bomPipeline'

export function BomPipelineProgress({ stages }: { stages: BomPipelineStage[] }) {
  return (
    <section className="bom-pipeline-progress" aria-label="BOM import progress">
      <ol>
        {stages.map((stage) => (
          <li
            key={stage.key}
            aria-current={stage.state === 'active' ? 'step' : undefined}
            data-state={stage.state}
          >
            <span>{stage.state === 'done' ? 'Done' : stage.state === 'active' ? 'In progress' : stage.state === 'failed' ? 'Failed' : 'Pending'}</span>
            {stage.label}
          </li>
        ))}
      </ol>
    </section>
  )
}
