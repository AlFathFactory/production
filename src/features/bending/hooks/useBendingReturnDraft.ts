import { useCallback, useState } from 'react'

import { getReturnQuantityError } from '../returnValidation'
import type { BendingDestinationInventoryLine, BendingReturnDraftItem } from '../types'

export function useBendingReturnDraft() {
  const [items, setItems] = useState<BendingReturnDraftItem[]>([])

  const syncLines = useCallback((lines: BendingDestinationInventoryLine[], targetedDispatchItemId: string | null = null) => {
    setItems((current) => {
      const existingItems = new Map(current.map((item) => [item.dispatchItemId, item]))
      return lines.map((line) => ({
        ...line,
        isSelected: line.dispatchItemId === targetedDispatchItemId
          || (existingItems.get(line.dispatchItemId)?.isSelected ?? false),
        quantity: existingItems.get(line.dispatchItemId)?.quantity ?? 0,
      }))
    })
  }, [])

  const toggleItem = (dispatchItemId: string) => {
    setItems((current) => {
      const target = current.find((item) => item.dispatchItemId === dispatchItemId)
      if (!target) return current

      const selectedDispatchId = current.find((item) => item.isSelected)?.dispatchId
      if (!target.isSelected && selectedDispatchId && selectedDispatchId !== target.dispatchId) {
        return current
      }

      return current.map((item) => item.dispatchItemId === dispatchItemId
        ? { ...item, isSelected: !item.isSelected, quantity: 0 }
        : item)
    })
  }

  const updateQuantity = (dispatchItemId: string, quantity: number) => {
    setItems((current) => current.map((item) => item.dispatchItemId === dispatchItemId
      ? { ...item, quantity: item.isSelected ? quantity : 0 }
      : item))
  }

  const clear = useCallback(() => setItems([]), [])
  const selectedItems = items.filter((item) => item.isSelected)
  const isValid = selectedItems.length > 0
    && selectedItems.every((item) => item.quantity > 0 && getReturnQuantityError(item.quantity, item.outstandingQuantity) === null)

  return { clear, isValid, items, selectedItems, syncLines, toggleItem, updateQuantity }
}
