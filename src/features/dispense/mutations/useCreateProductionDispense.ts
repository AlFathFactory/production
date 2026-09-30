import { useMutation, useQueryClient } from '@tanstack/react-query'

import { dashboardKeys } from '../../dashboard/queries/dashboardQueries'
import { productionHistoryKeys } from '../../production/history/queries/productionHistoryQueries'
import { productionKeys } from '../../production/queries/productionQueries'
import { reportKeys } from '../../reports/queries/reportQueries'
import { dispenseRepository } from '../dispenseRepository'
import { dispenseKeys } from '../queries/dispenseQueries'
import type { CreateProductionDispenseInput } from '../types'

export function useCreateProductionDispense() {
  const queryClient = useQueryClient()

  const invalidateAffectedData = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: dispenseKeys.all }),
    queryClient.invalidateQueries({ queryKey: productionKeys.all }),
    queryClient.invalidateQueries({ queryKey: productionHistoryKeys.all }),
    queryClient.invalidateQueries({ queryKey: reportKeys.all }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
  ])

  return useMutation({
    mutationFn: (input: CreateProductionDispenseInput) => dispenseRepository.createProductionDispense(input),
    onError: invalidateAffectedData,
    onSuccess: invalidateAffectedData,
  })
}
