import { useMutation, useQueryClient } from '@tanstack/react-query'

import { projectsRepository } from '../projectsRepository'
import { projectKeys } from '../queries/projectKeys'

export function useProjectMutations() {
  const queryClient = useQueryClient()
  const invalidateProjects = () => queryClient.invalidateQueries({ queryKey: projectKeys.list() })

  return {
    createProject: useMutation({
      mutationFn: projectsRepository.createProject,
      onSuccess: invalidateProjects,
    }),
    updateProject: useMutation({
      mutationFn: ({ id, ...values }: Parameters<typeof projectsRepository.updateProject>[1] & { id: string }) =>
        projectsRepository.updateProject(id, values),
      onSuccess: invalidateProjects,
    }),
  }
}
