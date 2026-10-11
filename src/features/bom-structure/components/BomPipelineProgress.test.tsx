import { render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { BomPipelineProgress } from './BomPipelineProgress'
import type { BomPipelineStage } from '../bomPipeline'

function stage(key: BomPipelineStage['key'], label: string, state: BomPipelineStage['state']): BomPipelineStage {
  return { key, label, state }
}

describe('BomPipelineProgress', () => {
  test('renders all eight stages with their states', () => {
    const stages = [
      stage('parsing', 'Parsing', 'done'),
      stage('validating', 'Validating', 'active'),
      stage('creating', 'Creating Import', 'pending'),
      stage('uploading', 'Uploading File', 'pending'),
      stage('attaching', 'Attaching Metadata', 'pending'),
      stage('saving', 'Saving Structure', 'pending'),
      stage('refreshing', 'Refreshing Data', 'pending'),
      stage('complete', 'Complete', 'pending'),
    ]
    render(<BomPipelineProgress stages={stages} />)
    const list = within(screen.getByLabelText(/bom import progress/i)).getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(8)
    const parsingItem = screen.getByText('Parsing').closest('li')
    expect(parsingItem?.querySelector('span')).toHaveTextContent('Done')
    const active = screen.getByText('Validating').closest('li')
    expect(active).toHaveAttribute('aria-current', 'step')
    expect(active?.firstChild).toHaveTextContent('In progress')
  })

  test('failed stages are announced without relying on color', () => {
    render(
      <BomPipelineProgress
        stages={[
          stage('parsing', 'Parsing', 'done'),
          stage('validating', 'Validating', 'done'),
          stage('creating', 'Creating Import', 'done'),
          stage('uploading', 'Uploading File', 'failed'),
          stage('attaching', 'Attaching Metadata', 'pending'),
          stage('saving', 'Saving Structure', 'pending'),
          stage('refreshing', 'Refreshing Data', 'pending'),
          stage('complete', 'Complete', 'pending'),
        ]}
      />,
    )
    const failed = screen.getByText('Uploading File').closest('li')
    expect(failed?.firstChild).toHaveTextContent('Failed')
    expect(failed).toHaveAttribute('data-state', 'failed')
  })
})
