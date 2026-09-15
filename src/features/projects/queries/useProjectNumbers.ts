import { useQuery } from '@tanstack/react-query'

import { projectsRepository } from '../projectsRepository'
import { projectKeys } from './projectKeys'

export function useProjectNumbers(projectId: string | null) {
  return useQuery({
    queryKey: projectKeys.numbers(projectId ?? 'no-project'),
    queryFn: () => projectsRepository.listProjectNumbers(projectId!),
    enabled: Boolean(projectId),
  })
}
