import type { BendingReturnDraftItem } from './types'

export function getReturnQuantityError(quantity: number, outstandingQuantity: number): string | null {
  if (!Number.isFinite(quantity) || quantity < 0) {
    return 'Enter zero or a quantity greater than zero.'
  }
  if (quantity > outstandingQuantity) {
    return `Quantity cannot exceed the outstanding ${outstandingQuantity}.`
  }
  return null
}

export function calculateReturnSummary(items: BendingReturnDraftItem[]) {
  return items.reduce(
    (summary, item) => item.isSelected && item.quantity > 0
      ? {
        estimatedWeightKg: summary.estimatedWeightKg
          + (item.unitWeightKg === null ? 0 : item.quantity * item.unitWeightKg),
        itemsWithWeight: summary.itemsWithWeight + (item.unitWeightKg === null ? 0 : 1),
        selectedLines: summary.selectedLines + 1,
        totalQuantity: summary.totalQuantity + item.quantity,
      }
      : summary,
    { estimatedWeightKg: 0, itemsWithWeight: 0, selectedLines: 0, totalQuantity: 0 },
  )
}
