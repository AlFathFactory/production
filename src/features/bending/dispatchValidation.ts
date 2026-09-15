import type { BendingDispatchDraftItem } from './types'

export function getDispatchQuantityError(quantity: number, availableQuantity: number): string | null {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 'Enter a quantity greater than zero.'
  }
  if (quantity > availableQuantity) {
    return `Quantity cannot exceed the available ${availableQuantity}.`
  }
  return null
}

export function calculateDispatchSummary(items: BendingDispatchDraftItem[]) {
  return items.reduce(
    (summary, item) => ({
      estimatedWeightKg: summary.estimatedWeightKg
        + (item.unitWeightKg === null ? 0 : item.quantity * item.unitWeightKg),
      itemsWithWeight: summary.itemsWithWeight + (item.unitWeightKg === null ? 0 : 1),
      totalQuantity: summary.totalQuantity + item.quantity,
    }),
    { estimatedWeightKg: 0, itemsWithWeight: 0, totalQuantity: 0 },
  )
}
