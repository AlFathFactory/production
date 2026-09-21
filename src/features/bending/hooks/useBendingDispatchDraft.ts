import { useCallback, useState } from 'react'

import type { ProductionSearchRow } from '../../production/types'
import { toNullableNumber } from '../../production/utils'
import { getDispatchQuantityError } from '../dispatchValidation'
import type { BendingDispatchDraftItem } from '../types'

function availableQuantity(item: ProductionSearchRow): number {
  return Math.max(0, item.remaining_out_bend ?? 0)
}

export function useBendingDispatchDraft() {
  const [items, setItems] = useState<BendingDispatchDraftItem[]>([])

  const addItem = (item: ProductionSearchRow) => {
    const productionItemId = item.production_item_id
    const article = item.article
    const currentAvailability = availableQuantity(item)

    if (!productionItemId || !article || currentAvailability <= 0) {
      return
    }

    setItems((current) => current.some((draftItem) => draftItem.productionItemId === productionItemId)
      ? current
      : [...current, {
        article,
        availableQuantity: currentAvailability,
        designation: item.designation,
        productionItemId,
        profile: item.profile,
        quantity: 0,
        unitWeightKg: toNullableNumber(item.unit_weight_kg),
      }])
  }

  const removeItem = (productionItemId: string) => {
    setItems((current) => current.filter((item) => item.productionItemId !== productionItemId))
  }

  const updateQuantity = (productionItemId: string, quantity: number) => {
    setItems((current) => current.map((item) => item.productionItemId === productionItemId
      ? { ...item, quantity }
      : item))
  }

  const syncAvailability = useCallback((productionItems: ProductionSearchRow[]) => {
    const availability = new Map(productionItems.flatMap((item) => item.production_item_id
      ? [[item.production_item_id, availableQuantity(item)] as const]
      : []))

    setItems((current) => current.map((item) => availability.has(item.productionItemId)
      ? { ...item, availableQuantity: availability.get(item.productionItemId) ?? 0 }
      : { ...item, availableQuantity: 0 }))
  }, [])

  const clear = () => setItems([])
  const isValid = items.length > 0
    && items.every((item) => getDispatchQuantityError(item.quantity, item.availableQuantity) === null)

  return { addItem, clear, isValid, items, removeItem, syncAvailability, updateQuantity }
}
