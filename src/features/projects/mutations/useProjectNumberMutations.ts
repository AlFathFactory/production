import { useMutation, useQueryClient } from '@tanstack/react-query'

import { projectsRepository } from '../projectsRepository'
import { projectKeys } from '../queries/projectKeys'
import type { ProjectNumberFormValues } from '../types'

interface ProjectNumberMutationValues extends ProjectNumberFormValues {
  projectId: string
}

interface UpdateProjectNumberMutationValues extends ProjectNumberFormValues {
  id: string
  projectId: string
}

export function useProjectNumberMutations() {
  const queryClient = useQueryClient()
  const invalidateNumbers = (projectId: string) =>
    queryClient.invalidateQueries({ queryKey: projectKeys.numbers(projectId) })

  return {
    createProjectNumber: useMutation({
      mutationFn: ({ projectId, ...values }: ProjectNumberMutationValues) =>
        projectsRepository.createProjectNumber(projectId, values),
      onSuccess: (_data, variables) => invalidateNumbers(variables.projectId),
    }),
    updateProjectNumber: useMutation({
      mutationFn: ({ id, ...values }: UpdateProjectNumberMutationValues) =>
        projectsRepository.updateProjectNumber(id, values),
      onSuccess: (_data, variables) => invalidateNumbers(variables.projectId),
    }),
    deleteProjectNumber: useMutation({
      mutationFn: ({ id }: { id: string; projectId: string }) => projectsRepository.deleteProjectNumber(id),
      onSuccess: (_data, variables) => invalidateNumbers(variables.projectId),
    }),
  }
}
