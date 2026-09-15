import { useQuery } from '@tanstack/react-query'

import { projectsRepository } from '../projectsRepository'
import { projectKeys } from './projectKeys'

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: () => projectsRepository.listProjects(),
  })
}
