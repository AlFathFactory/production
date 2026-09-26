import type { ReportOperation } from './types'

export const reportOperations: readonly ReportOperation[] = [
  'CUT',
  'OUT_BEND',
  'BEND',
  'ROLLING',
  'DISPENSE',
]

export const reportOperationLabels: Record<ReportOperation, string> = {
  CUT: 'CUT',
  OUT_BEND: 'Issue Packing',
  BEND: 'Receive Packing',
  ROLLING: 'ROLLING',
  DISPENSE: 'DISPENSE',
}
