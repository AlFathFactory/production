import type { CurrentStatus, ReportOperation } from './types'

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
  BEND: 'BENDED',
  ROLLING: 'ROLLING',
  DISPENSE: 'DISPENSE',
}

export const currentStatuses: readonly CurrentStatus[] = [
  'REMAINING_CUT',
  'WAITING_ISSUE_PACKING',
  'WAITING_RECEIVE_PACKING',
  'WAITING_ROLLING',
  'READY_TO_DISPENSE',
  'PARTIALLY_DISPENSED',
  'COMPLETED',
  'NOT_STARTED',
]

export const currentStatusLabels: Record<CurrentStatus, string> = {
  REMAINING_CUT: 'Remaining to Cut',
  WAITING_ISSUE_PACKING: 'Waiting for OUT BEND',
  WAITING_RECEIVE_PACKING: 'Waiting for Receive Packing',
  WAITING_ROLLING: 'Waiting for Rolling',
  READY_TO_DISPENSE: 'Ready to Dispense',
  PARTIALLY_DISPENSED: 'Partially Dispensed',
  COMPLETED: 'Completed',
  NOT_STARTED: 'Not Started',
}
