import { useMutation, useQueryClient } from '@tanstack/react-query'

import { bendingKeys } from '../../bending/queries/bendingQueries'
import { dashboardKeys } from '../../dashboard/queries/dashboardQueries'
import { dispenseKeys } from '../../dispense/queries/dispenseQueries'
import { documentKeys } from '../../documents/queries/documentQueries'
import { productionHistoryKeys } from '../../production/history/queries/productionHistoryQueries'
import { productionKeys } from '../../production/queries/productionQueries'
import { reportKeys } from '../../reports/queries/reportQueries'
import { projectsRepository } from '../projectsRepository'
import { projectKeys } from '../queries/projectKeys'

interface DeleteProjectWithDataInput {
  projectId: string
  confirmation: string
}

export function useDeleteProjectWithData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, confirmation }: DeleteProjectWithDataInput) =>
      projectsRepository.deleteProjectWithData(projectId, confirmation),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
      queryClient.invalidateQueries({ queryKey: productionKeys.all }),
      queryClient.invalidateQueries({ queryKey: productionHistoryKeys.all }),
      queryClient.invalidateQueries({ queryKey: reportKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      queryClient.invalidateQueries({ queryKey: bendingKeys.all }),
      queryClient.invalidateQueries({ queryKey: dispenseKeys.all }),
      queryClient.invalidateQueries({ queryKey: documentKeys.all }),
    ]),
  })
}
