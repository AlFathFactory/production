import { useCallback, useState } from 'react'

import { getReturnQuantityError } from '../returnValidation'
import type { BendingReturnDraftItem, BendingReturnLine } from '../types'

export function useBendingReturnDraft() {
  const [items, setItems] = useState<BendingReturnDraftItem[]>([])

  const syncLines = useCallback((lines: BendingReturnLine[]) => {
    setItems((current) => {
      const existingQuantities = new Map(current.map((item) => [item.dispatchItemId, item.quantity]))
      return lines.map((line) => ({
        ...line,
        quantity: existingQuantities.get(line.dispatchItemId) ?? 0,
      }))
    })
  }, [])

  const updateQuantity = (dispatchItemId: string, quantity: number) => {
    setItems((current) => current.map((item) => item.dispatchItemId === dispatchItemId
      ? { ...item, quantity }
      : item))
  }

  const clear = () => setItems([])
  const selectedItems = items.filter((item) => item.quantity > 0)
  const isValid = selectedItems.length > 0
    && items.every((item) => getReturnQuantityError(item.quantity, item.outstandingQuantity) === null)

  return { clear, isValid, items, selectedItems, syncLines, updateQuantity }
}
